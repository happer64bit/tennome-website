import { Button } from "./ui/button";
import { ethers } from "ethers";
import { signIn } from "next-auth/react";

declare global {
    interface Window {
        ethereum?: any;
    }
}

export default function () {
    return (
        <nav className="fixed top-0 left-0 w-full px-6 py-3 flex items-center z-50 justify-between">
            <a href="/">
                <img src="/favicon.ico" className="h-10 w-auto transform duration-100 grayscale hover:grayscale-0 cursor-pointer" alt="logo" />
            </a>
            <div className="flex items-center gap-4">
                {!window.ethereum.isConnected() && (
                    <Button className="bg-white text-black hover:text-white px-6" onClick={async () => {
                        try {
                            if (!window.ethereum) {
                                window.alert("Please install MetaMask first.");
                                return;
                            }

                            const provider = new ethers.BrowserProvider(window.ethereum);
                            const signer = await provider.getSigner();
                            const publicAddress = await signer.getAddress();
                            const response = await fetch("/api/auth/crypto/generateNonce", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    publicAddress,
                                }),
                            });
                            console.log(response.ok)
                            const responseData = await response.json();

                            const signedNonce = await signer.signMessage(responseData.nonce);

                            await signIn("crypto", {
                                publicAddress,
                                signedNonce,
                                callbackUrl: "/?login=success&encoding=UTF-8",
                            });
                        } catch (err) {
                            window.alert("Error with signing, please try again.");
                        }
                    }}>
                        Connect
                    </Button>
                )}
            </div>
        </nav>
    )
}