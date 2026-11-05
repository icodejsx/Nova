#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(NovaRegistry, ());
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let client = NovaRegistryClient::new(&env, &contract_id);
    client.initialize(&admin, &token);
    (env, contract_id, admin, token)
}

fn empty_invite(env: &Env) -> String {
    String::from_str(env, "")
}

#[test]
fn empty_pools_fifty_fifty() {
    assert_eq!(yes_percent(0, 0), 50);
    assert_eq!(yes_percent(100, 100), 50);
    assert_eq!(yes_percent(75, 25), 75);
}

#[test]
fn create_bet_resolve_claim() {
    let (env, contract_id, _admin, _token) = setup();
    let client = NovaRegistryClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.add_creator(&creator);

    let end = env.ledger().timestamp() + 1_000;
    let id = client.create_market(
        &creator,
        &String::from_str(&env, "Will XLM hit $1?"),
        &String::from_str(&env, "Crypto"),
        &end,
        &false,
        &empty_invite(&env),
    );
    assert_eq!(id, 1);

    client.bet(&alice, &id, &true, &100_i128);
    client.bet(&bob, &id, &false, &100_i128);

    let m = client.get_market(&id);
    assert_eq!(m.total_yes, 100);
    assert_eq!(m.total_no, 100);
    assert!(!m.is_private);

    env.ledger().set_timestamp(end + 1);
    client.resolve(&creator, &id, &true);

    let payout = client.claim(&alice, &id);
    assert_eq!(payout, 196);

    let err = client.try_claim(&alice, &id);
    assert!(err.is_err());
}

#[test]
fn non_creator_cannot_create() {
    let (env, contract_id, _admin, _token) = setup();
    let client = NovaRegistryClient::new(&env, &contract_id);
    let stranger = Address::generate(&env);
    let end = env.ledger().timestamp() + 100;
    let result = client.try_create_market(
        &stranger,
        &String::from_str(&env, "Unauthorized?"),
        &String::from_str(&env, "Other"),
        &end,
        &false,
        &empty_invite(&env),
    );
    assert!(result.is_err());
}

#[test]
fn private_market_requires_invite() {
    let (env, contract_id, _admin, _token) = setup();
    let client = NovaRegistryClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.add_creator(&creator);

    let end = env.ledger().timestamp() + 1_000;
    let invite = String::from_str(&env, "NOVA-TEAM01");
    let id = client.create_market(
        &creator,
        &String::from_str(&env, "Private launch deadline?"),
        &String::from_str(&env, "Other"),
        &end,
        &true,
        &invite,
    );

    let m = client.get_market(&id);
    assert!(m.is_private);
    assert!(client.has_access(&id, &creator));
    assert!(!client.has_access(&id, &alice));

    // Alice cannot bet without access
    let denied = client.try_bet(&alice, &id, &true, &50_i128);
    assert!(denied.is_err());

    // Wrong code fails
    let bad = client.try_redeem_invite(&alice, &id, &String::from_str(&env, "WRONG"));
    assert!(bad.is_err());

    // Redeem + bet
    client.redeem_invite(&alice, &id, &invite);
    assert!(client.has_access(&id, &alice));
    client.bet(&alice, &id, &true, &50_i128);

    // Creator can allowlist Bob directly
    client.add_allowlist(&creator, &id, &bob);
    assert!(client.has_access(&id, &bob));
    client.bet(&bob, &id, &false, &50_i128);

    let m = client.get_market(&id);
    assert_eq!(m.total_yes, 50);
    assert_eq!(m.total_no, 50);
}

#[test]
fn private_requires_invite_code() {
    let (env, contract_id, _admin, _token) = setup();
    let client = NovaRegistryClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    client.add_creator(&creator);
    let end = env.ledger().timestamp() + 100;
    let result = client.try_create_market(
        &creator,
        &String::from_str(&env, "Missing invite?"),
        &String::from_str(&env, "Other"),
        &end,
        &true,
        &empty_invite(&env),
    );
    assert!(result.is_err());
}
