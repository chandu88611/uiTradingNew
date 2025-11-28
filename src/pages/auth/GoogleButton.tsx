import React, { useEffect } from "react";
import { useGoogleLoginMutation } from "../../services/userApi";
import { toast } from "react-toastify";

const GoogleButton = ({ onSuccess }: { onSuccess: () => void }) => {
  const [googleLogin] = useGoogleLoginMutation();

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: "88832759206-gdc5iiimj61j1j3vr26p9jl1ltqivn58.apps.googleusercontent.com",
      callback: async (response: any) => {
        try {
          const res = await googleLogin({ id_token: response.credential }).unwrap();

          localStorage.setItem("accessToken", res.tokens.access);
          localStorage.setItem("refreshToken", res.tokens.refresh);

          onSuccess();
        } catch (e) {
          toast.error("Google login failed");
        }
      },
    });

    google.accounts.id.renderButton(
      document.getElementById("google-btn")!,
      {
        theme: "outline",
        size: "large",
        width: "100%",
      }
    );
  }, []);

  return <div id="google-btn" className="w-full" />;
};

export default GoogleButton;
