# Torque On-chain Leaderboard Evidence — 2026-05-10T14:30Z

Safe claim: `/leaderboard` is backed by live Solana devnet AgentAccount state: completed jobs and reputation scores updated by escrow settlement and blind reputation reveal transactions. Torque-compatible custom events are also emitted through the app event endpoint.

Do not claim paid Torque rewards distributed.

## Fresh devnet transaction set

- lock escrow: `3PRCvHcezSknvXtrwLCMHCSrgrxbuQRTJ8xu5ELfLK4NA75H9zU18Es2VnKkfPEDPFNFPeoNBMykZeokG84235JV`
- release escrow: `4b1GhWBY7Qb3rhNbUBZQTRa6sp7xpd34dNXxqrBXdxmbJwqZhvXufJ1qUTk5aMiFV4ookVyYFKfSYL8UX3z5E93J`
- commit consumer rating: `5humGqcU8hW1Bf1H6C7dFCtpntz7ctXjx897bLs6QxCF3yPhY6cH2rWm9GXxSQib9deigGJRgUfDzF1tFVohD4se`
- commit specialist rating: `3PGhfnhW64fSPmbZBu7RGT2cW73BEMi3JRoA1267yzjpmsDSY2C1AecKTvMYbJqPoSwVgjZsL72UF3AqD5pCPCut`
- reveal consumer rating: `2zRmhKKZi7nLwa7SMcLS7qQ6jNHcn5yyudYxx6NZzAujUNMumYBwBei1ynafJBfyN1RumPYe6TkgWcr5mnbdqvZK`
- reveal specialist rating: `2DFectHf8jV15gjmD3ADUgsdRfyF1FgX9bruHFgPNwW8KyPEUZPEvAspTK7SDnEFL7xhMjQi3BCovc3JJXY8yPnu`

Agent B PDA after run: `ET155YLD2UFcSd56pQZWbR9zMfgqhrAegCho3UnniLZ7`; jobs completed `2`; reputation score `1520`.

Known boundary: attestation failed because Agent C was registered as Primary, not Attestation/Both. The leaderboard proof is escrow + reputation, not attestation.
