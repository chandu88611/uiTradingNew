import React, { useEffect, useRef } from "react";
import { useGoogleLoginMutation } from "../../services/userApi";
import { toast } from "react-toastify";

type GoogleButtonProps = {
  onSuccess: () => void;
  referralCode?: string;
};

const GoogleButton = ({
  onSuccess,
  referralCode,
}: GoogleButtonProps) => {
  const [googleLogin] = useGoogleLoginMutation();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const google = (window as any).google;

    if (!google?.accounts?.id) {
      toast.error("Google authentication is not available");
      return;
    }

    if (!initializedRef.current) {
      google.accounts.id.initialize({
        client_id:
          "88832759206-gdc5iiimj61j1j3vr26p9jl1ltqivn58.apps.googleusercontent.com",
        callback: async (response: any) => {
          try {
            const credential = response?.credential;

            if (!credential) {
              toast.error("Google credential not received");
              return;
            }

            await googleLogin({
              id_token: credential,
              referralCode: referralCode?.trim() || undefined,
            }).unwrap();

            onSuccess();
          } catch (e: any) {
            toast.error(e?.data?.message || "Google login failed");
          }
        },
      });

      initializedRef.current = true;
    }

    if (buttonRef.current) {
      buttonRef.current.innerHTML = "";

      google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    }
  }, [googleLogin, onSuccess, referralCode]);

  return <div ref={buttonRef} className="w-full" />;
};

export default GoogleButton;