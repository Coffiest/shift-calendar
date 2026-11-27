"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** URL の QR コード。読み取りやすいよう、ダークモードでも白地に黒で描く */
export function Qr({ value, size = 200 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    if (!value) return;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [value]);
  return (
    <div className="rounded-[20px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" style={{ width: size + 32, height: size + 32 }}>
      <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} aria-label="バイトに送るリンクの QR コード" role="img" />
    </div>
  );
}
