import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { ethers } from "ethers";
import NextAuth, { AuthOptions, RequestInternal } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

async function authorizeCrypto(
    credentials: Record<"publicAddress" | "signedNonce", string> | undefined,
    req: Pick<RequestInternal, "body" | "headers" | "method" | "query">
) {
    if (!credentials) return null;

    const { publicAddress, signedNonce } = credentials;

    // Get user from database with their generated nonce
    const user = await prisma.user.findUnique({
        where: { publicAddress },
        include: { CryptoLoginNonce: true },
    });

    if (!user?.CryptoLoginNonce) return null;

    // Compute the signer address from the saved nonce and the received signature
    const signerAddress = ethers.verifyMessage(
        user.CryptoLoginNonce.nonce,
        signedNonce
    );

    // Check that the signer address matches the public address
    //  that is trying to sign in
    if (signerAddress !== publicAddress) return null;

    // Check that the nonce is not expired
    if (user.CryptoLoginNonce.expires < new Date()) return null;

    // Everything is fine, clear the nonce and return the user
    await prisma.cryptoLoginNonce.delete({ where: { userId: user.id } });

    return {
        id: user.id,
        publicAddress: user.publicAddress,
    };
}

// see: https://next-auth.js.org/configuration/options
export const authOptions: AuthOptions = {
    // Setting error and signin pages to our /auth custom page
    pages: {
        signIn: "/auth",
        error: "/auth",
    },
    providers: [
        // see: https://next-auth.js.org/configuration/providers/credentials
        CredentialsProvider({
            id: "crypto",
            name: "Crypto Wallet Auth",
            credentials: {
                publicAddress: { label: "Public Address", type: "text" },
                signedNonce: { label: "Signed Nonce", type: "text" },
            },
            authorize: authorizeCrypto,
        }),
    ],
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    // Setting secret here for convenience, do not use this in production
    secret: "b44935463810ed4aa5456a357e18fae000fa76ca813f3f5a7ddec7af0f12e482",
};

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };