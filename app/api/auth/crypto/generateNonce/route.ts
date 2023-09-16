import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const genRanHex = (size: number) => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

export async function POST(request: NextRequest) {
    const { publicAddress } = await request.json();

    const nonce = genRanHex(64)

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
