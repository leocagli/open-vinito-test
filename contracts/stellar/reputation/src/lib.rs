#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Reputation(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct ReputationEntry {
    pub actor: Address,
    pub score: i32,
    pub updated_at: u64,
}

#[contract]
pub struct StellarReputation;

#[contractimpl]
impl StellarReputation {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get(env: Env, actor: Address) -> ReputationEntry {
        let key = DataKey::Reputation(actor.clone());
        if let Some(existing) = env.storage().instance().get::<DataKey, ReputationEntry>(&key) {
            return existing;
        }

        ReputationEntry {
            actor,
            score: 500,
            updated_at: env.ledger().timestamp(),
        }
    }

    pub fn set_score(env: Env, actor: Address, score: i32) -> ReputationEntry {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let bounded = clamp_score(score);
        let entry = ReputationEntry {
            actor: actor.clone(),
            score: bounded,
            updated_at: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Reputation(actor), &entry);
        entry
    }

    pub fn apply_delta(env: Env, actor: Address, delta: i32) -> ReputationEntry {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let current = Self::get(env.clone(), actor.clone());
        let next = clamp_score(current.score + delta);

        let entry = ReputationEntry {
            actor: actor.clone(),
            score: next,
            updated_at: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Reputation(actor), &entry);
        entry
    }
}

fn clamp_score(value: i32) -> i32 {
    if value < 0 {
        return 0;
    }
    if value > 1000 {
        return 1000;
    }
    value
}
