//! MagicBlock program/account constants captured from the SDK fixture.

use quasar_lang::prelude::Address;

/// MagicBlock Permission Program on devnet/mainnet.
pub const PERMISSION_PROGRAM_ID_STR: &str = "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1";
pub const PERMISSION_PROGRAM_ID: Address = Address::new_from_array([
    136, 161, 10, 196, 33, 152, 1, 214, 246, 106, 29, 60, 6, 152, 192, 102, 169, 175, 212, 217,
    180, 252, 231, 71, 151, 141, 209, 5, 168, 212, 103, 82,
]);

/// MagicBlock Delegation Program on devnet/mainnet.
pub const DELEGATION_PROGRAM_ID_STR: &str = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
pub const DELEGATION_PROGRAM_ID: Address = Address::new_from_array([
    181, 183, 0, 225, 242, 87, 58, 192, 204, 6, 34, 1, 52, 74, 207, 151, 184, 53, 6, 235, 140, 229,
    25, 152, 204, 98, 126, 24, 147, 128, 167, 62,
]);

/// MagicBlock program used by commit+undelegate permission.
pub const MAGIC_PROGRAM_ID_STR: &str = "Magic11111111111111111111111111111111111111";
pub const MAGIC_PROGRAM_ID: Address = Address::new_from_array([
    5, 69, 180, 36, 176, 218, 112, 149, 236, 185, 214, 222, 195, 119, 215, 40, 145, 182, 231,
    142, 146, 234, 18, 214, 223, 187, 58, 64, 0, 0, 0, 0,
]);

/// MagicBlock context account used by commit+undelegate permission.
pub const MAGIC_CONTEXT_ID_STR: &str = "MagicContext1111111111111111111111111111111";
pub const MAGIC_CONTEXT_ID: Address = Address::new_from_array([
    5, 69, 180, 36, 196, 165, 40, 191, 95, 180, 3, 47, 68, 82, 130, 142, 187, 56, 171, 193,
    210, 220, 151, 247, 63, 139, 148, 84, 128, 0, 0, 0,
]);

/// Devnet TEE validator currently listed in MagicBlock private PER docs.
pub const DEVNET_TEE_VALIDATOR_STR: &str = "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo";
pub const DEVNET_TEE_VALIDATOR_ID: Address = Address::new_from_array([
    5, 61, 71, 26, 133, 158, 115, 46, 104, 11, 201, 88, 248, 65, 7, 43, 143, 63, 188, 25, 115, 155,
    230, 151, 196, 198, 129, 18, 111, 140, 31, 116,
]);

/// MagicBlock undelegation callback discriminator required in our PER program.
pub const UNDELEGATE_CALLBACK_DISCRIMINATOR: [u8; 8] = [196, 28, 41, 206, 48, 37, 51, 167];
