//! MagicBlock program/account constants captured from the SDK fixture.

/// MagicBlock Permission Program on devnet/mainnet.
pub const PERMISSION_PROGRAM_ID_STR: &str = "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1";

/// MagicBlock Delegation Program on devnet/mainnet.
pub const DELEGATION_PROGRAM_ID_STR: &str = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";

/// MagicBlock program used by commit+undelegate permission.
pub const MAGIC_PROGRAM_ID_STR: &str = "Magic11111111111111111111111111111111111111";

/// MagicBlock context account used by commit+undelegate permission.
pub const MAGIC_CONTEXT_ID_STR: &str = "MagicContext1111111111111111111111111111111";

/// Devnet TEE validator currently listed in MagicBlock private PER docs.
pub const DEVNET_TEE_VALIDATOR_STR: &str = "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo";

/// MagicBlock undelegation callback discriminator required in our PER program.
pub const UNDELEGATE_CALLBACK_DISCRIMINATOR: [u8; 8] = [196, 28, 41, 206, 48, 37, 51, 167];
