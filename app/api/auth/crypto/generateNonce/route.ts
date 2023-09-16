import { prisma } from "@/lib/prisma";
import { webcrypto } from "crypto";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const { publicAddress } = await request.json();

    const nonce = webcrypto.getRandomValues(new Uint32Array(64)).toString()

    const expires = new Date(new Date().getTime() + 1000 * 60 * 60);

    await prisma.user.upsert({
        where: { publicAddress },
        create: {
            publicAddress,
            CryptoLoginNonce: {
                create: {
                    nonce,
                    expires,
                },
            },
        },
        update: {
            CryptoLoginNonce: {
                upsert: {
                    create: {
                        nonce,
                        expires,
                    },
                    update: {
                        nonce,
                        expires,
                    },
                },
            },
        },
    });

    return new Response(JSON.stringify({
        nonce,
        expires: expires.toISOString(),
    }));
}
