#![no_std]

//! Nova registry — Option B: single contract, market IDs, USDC stakes.
//!
//! Phase A: public binary markets (create / bet / resolve / claim).
//! Phase B: private / invite-only markets (allowlist + invite redeem).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
    Vec,
};

const FEE_BPS: i128 = 200; // 2%
const BPS_DENOM: i128 = 10_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAdmin = 3,
    NotCreator = 4,
    NotMarketCreator = 5,
    MarketNotFound = 6,
    BettingClosed = 7,
    BettingOpen = 8,
    AlreadyResolved = 9,
    NotResolved = 10,
    AlreadyClaimed = 11,
    NothingToClaim = 12,
    InvalidAmount = 13,
    InvalidEndTime = 14,
    EmptyQuestion = 15,
    NotAllowed = 16,
    InvalidInvite = 17,
    NotPrivate = 18,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Market {
    pub id: u32,
    pub question: String,
    pub category: String,
    pub creator: Address,
    pub end_time: u64,
    pub resolved: bool,
    pub outcome: bool, // true = YES
    pub total_yes: i128,
    pub total_no: i128,
    /// Phase B: invite-only / allowlist gated
    pub is_private: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub yes_bet: i128,
    pub no_bet: i128,
    pub claimed: bool,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Token,
    Initialized,
    NextId,
    Creator(Address),
    Market(u32),
    Position(u32, Address),
    MarketIds,
    /// Phase B: invite code string for private market (empty if public)
    Invite(u32),
    /// Phase B: allowlist entry
    Allowed(u32, Address),
}

#[contract]
pub struct NovaRegistry;

#[contractimpl]
impl NovaRegistry {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::NextId, &1u32);
        env.storage()
            .instance()
            .set(&DataKey::MarketIds, &Vec::<u32>::new(&env));
        env.storage().instance().set(&DataKey::Initialized, &true);
        Ok(())
    }

    pub fn add_creator(env: Env, creator: Address) -> Result<(), Error> {
        require_admin(&env)?;
        env.storage()
            .persistent()
            .set(&DataKey::Creator(creator), &true);
        Ok(())
    }

    pub fn remove_creator(env: Env, creator: Address) -> Result<(), Error> {
        require_admin(&env)?;
        env.storage()
            .persistent()
            .remove(&DataKey::Creator(creator));
        Ok(())
    }

    pub fn is_creator(env: Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Creator(address))
            .unwrap_or(false)
    }

    /// Create a market. Pass `is_private=true` and a non-empty `invite_code` for Phase B.
    pub fn create_market(
        env: Env,
        creator: Address,
        question: String,
        category: String,
        end_time: u64,
        is_private: bool,
        invite_code: String,
    ) -> Result<u32, Error> {
        require_initialized(&env)?;
        creator.require_auth();
        if !Self::is_creator(env.clone(), creator.clone()) {
            return Err(Error::NotCreator);
        }
        if question.len() == 0 {
            return Err(Error::EmptyQuestion);
        }
        let now = env.ledger().timestamp();
        if end_time <= now {
            return Err(Error::InvalidEndTime);
        }
        if is_private && invite_code.len() == 0 {
            return Err(Error::InvalidInvite);
        }

        let id: u32 = env.storage().instance().get(&DataKey::NextId).unwrap();
        let market = Market {
            id,
            question,
            category,
            creator: creator.clone(),
            end_time,
            resolved: false,
            outcome: false,
            total_yes: 0,
            total_no: 0,
            is_private,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Market(id), &market);

        if is_private {
            env.storage()
                .persistent()
                .set(&DataKey::Invite(id), &invite_code);
            // Creator always allowed
            env.storage()
                .persistent()
                .set(&DataKey::Allowed(id, creator.clone()), &true);
        }

        let mut ids: Vec<u32> = env
            .storage()
            .instance()
            .get(&DataKey::MarketIds)
            .unwrap_or(Vec::new(&env));
        ids.push_back(id);
        env.storage().instance().set(&DataKey::MarketIds, &ids);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        env.events().publish(
            (symbol_short!("created"), id),
            (creator, end_time, is_private),
        );
        Ok(id)
    }

    /// Creator adds an address to a private market allowlist.
    pub fn add_allowlist(
        env: Env,
        creator: Address,
        market_id: u32,
        user: Address,
    ) -> Result<(), Error> {
        creator.require_auth();
        let market = get_market(&env, market_id)?;
        if market.creator != creator {
            return Err(Error::NotMarketCreator);
        }
        if !market.is_private {
            return Err(Error::NotPrivate);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Allowed(market_id, user.clone()), &true);
        env.events()
            .publish((Symbol::new(&env, "allow"), market_id), user);
        Ok(())
    }

    /// Redeem invite code → join allowlist for a private market.
    pub fn redeem_invite(
        env: Env,
        user: Address,
        market_id: u32,
        invite_code: String,
    ) -> Result<(), Error> {
        user.require_auth();
        let market = get_market(&env, market_id)?;
        if !market.is_private {
            return Err(Error::NotPrivate);
        }
        let expected: String = env
            .storage()
            .persistent()
            .get(&DataKey::Invite(market_id))
            .ok_or(Error::InvalidInvite)?;
        if !string_eq(&env, &expected, &invite_code) {
            return Err(Error::InvalidInvite);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Allowed(market_id, user.clone()), &true);
        env.events()
            .publish((Symbol::new(&env, "redeem"), market_id), user);
        Ok(())
    }

    pub fn has_access(env: Env, market_id: u32, user: Address) -> bool {
        match get_market(&env, market_id) {
            Ok(m) => has_access_inner(&env, &m, &user),
            Err(_) => false,
        }
    }

    /// Place a bet. Private markets require allowlist / invite access.
    pub fn bet(
        env: Env,
        user: Address,
        market_id: u32,
        is_yes: bool,
        amount: i128,
    ) -> Result<(), Error> {
        require_initialized(&env)?;
        user.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut market = get_market(&env, market_id)?;
        if market.resolved {
            return Err(Error::AlreadyResolved);
        }
        if env.ledger().timestamp() >= market.end_time {
            return Err(Error::BettingClosed);
        }
        if !has_access_inner(&env, &market, &user) {
            return Err(Error::NotAllowed);
        }

        // TODO(deploy): transfer `amount` of USDC from user → contract via token client.

        if is_yes {
            market.total_yes = market.total_yes + amount;
        } else {
            market.total_no = market.total_no + amount;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Market(market_id), &market);

        let mut pos = get_position(&env, market_id, &user);
        if is_yes {
            pos.yes_bet = pos.yes_bet + amount;
        } else {
            pos.no_bet = pos.no_bet + amount;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Position(market_id, user.clone()), &pos);

        let yes_pct = yes_percent(market.total_yes, market.total_no);
        env.events().publish(
            (Symbol::new(&env, "bet"), market_id),
            (user, is_yes, amount, yes_pct),
        );
        Ok(())
    }

    pub fn resolve(env: Env, creator: Address, market_id: u32, outcome: bool) -> Result<(), Error> {
        creator.require_auth();
        let mut market = get_market(&env, market_id)?;
        if market.creator != creator {
            return Err(Error::NotMarketCreator);
        }
        if market.resolved {
            return Err(Error::AlreadyResolved);
        }
        if env.ledger().timestamp() < market.end_time {
            return Err(Error::BettingOpen);
        }
        market.resolved = true;
        market.outcome = outcome;
        env.storage()
            .persistent()
            .set(&DataKey::Market(market_id), &market);
        env.events()
            .publish((symbol_short!("resolve"), market_id), outcome);
        Ok(())
    }

    pub fn claim(env: Env, user: Address, market_id: u32) -> Result<i128, Error> {
        user.require_auth();
        let market = get_market(&env, market_id)?;
        if !market.resolved {
            return Err(Error::NotResolved);
        }
        let mut pos = get_position(&env, market_id, &user);
        if pos.claimed {
            return Err(Error::AlreadyClaimed);
        }
        let user_stake = if market.outcome {
            pos.yes_bet
        } else {
            pos.no_bet
        };
        if user_stake <= 0 {
            return Err(Error::NothingToClaim);
        }
        let winning_pool = if market.outcome {
            market.total_yes
        } else {
            market.total_no
        };
        let losing_pool = if market.outcome {
            market.total_no
        } else {
            market.total_yes
        };
        let gross = user_stake + (user_stake * losing_pool) / winning_pool;
        let net = gross - (gross * FEE_BPS) / BPS_DENOM;

        pos.claimed = true;
        env.storage()
            .persistent()
            .set(&DataKey::Position(market_id, user.clone()), &pos);

        // TODO(deploy): transfer `net` USDC from contract → user.

        env.events()
            .publish((symbol_short!("claim"), market_id), (user, net));
        Ok(net)
    }

    pub fn get_market(env: Env, market_id: u32) -> Result<Market, Error> {
        get_market(&env, market_id)
    }

    pub fn get_position(env: Env, market_id: u32, user: Address) -> Position {
        get_position(&env, market_id, &user)
    }

    pub fn market_count(env: Env) -> u32 {
        let ids: Vec<u32> = env
            .storage()
            .instance()
            .get(&DataKey::MarketIds)
            .unwrap_or(Vec::new(&env));
        ids.len()
    }

    pub fn list_markets(env: Env) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::MarketIds)
            .unwrap_or(Vec::new(&env))
    }
}

fn require_initialized(env: &Env) -> Result<(), Error> {
    if env.storage().instance().has(&DataKey::Initialized) {
        Ok(())
    } else {
        Err(Error::NotInitialized)
    }
}

fn require_admin(env: &Env) -> Result<(), Error> {
    require_initialized(env)?;
    let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
    admin.require_auth();
    Ok(())
}

fn get_market(env: &Env, market_id: u32) -> Result<Market, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Market(market_id))
        .ok_or(Error::MarketNotFound)
}

fn get_position(env: &Env, market_id: u32, user: &Address) -> Position {
    env.storage()
        .persistent()
        .get(&DataKey::Position(market_id, user.clone()))
        .unwrap_or(Position {
            yes_bet: 0,
            no_bet: 0,
            claimed: false,
        })
}

fn has_access_inner(env: &Env, market: &Market, user: &Address) -> bool {
    if !market.is_private {
        return true;
    }
    if &market.creator == user {
        return true;
    }
    env.storage()
        .persistent()
        .get(&DataKey::Allowed(market.id, user.clone()))
        .unwrap_or(false)
}

fn string_eq(_env: &Env, a: &String, b: &String) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let len = a.len() as usize;
    // Invite codes are short; reject absurd lengths.
    if len > 64 {
        return false;
    }
    let mut buf_a = [0u8; 64];
    let mut buf_b = [0u8; 64];
    a.copy_into_slice(&mut buf_a[..len]);
    b.copy_into_slice(&mut buf_b[..len]);
    buf_a[..len] == buf_b[..len]
}

fn yes_percent(total_yes: i128, total_no: i128) -> i128 {
    let total = total_yes + total_no;
    if total == 0 {
        return 50;
    }
    (total_yes * 100) / total
}

#[cfg(test)]
mod test;
