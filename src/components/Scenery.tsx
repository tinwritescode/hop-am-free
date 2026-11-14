// Original painted scenery: sky, clouds, a floating forest island, layered hills.

export function SkyBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#d6ecf1]">
      <svg aria-hidden="true" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9e6ef" />
            <stop offset="0.7" stopColor="#eaf5ef" />
            <stop offset="1" stopColor="#f4f8f1" />
          </linearGradient>
        </defs>
        <rect width="1440" height="360" fill="url(#sky)" />
        <circle cx="1210" cy="70" r="110" fill="#fff8dc" opacity="0.45" />
        <circle cx="1210" cy="70" r="46" fill="#fff6d2" />
        <g fill="#fff" opacity="0.95">
          <ellipse cx="160" cy="96" rx="70" ry="22" /><ellipse cx="210" cy="80" rx="48" ry="26" /><ellipse cx="120" cy="84" rx="36" ry="20" />
          <ellipse cx="620" cy="60" rx="56" ry="16" /><ellipse cx="660" cy="48" rx="36" ry="20" />
          <ellipse cx="900" cy="128" rx="80" ry="18" /><ellipse cx="950" cy="114" rx="44" ry="22" />
        </g>
        <g fill="none" stroke="#5e7f72" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
          <path d="M760 92q6-6 12 0q6-6 12 0" /><path d="M792 108q5-5 10 0q5-5 10 0" />
        </g>
        <path d="M1030 186 Q1120 202 1250 186 L1200 236 Q1170 276 1140 310 Q1112 270 1074 238 Z" fill="#a58d69" />
        <path d="M1074 238 Q1112 270 1140 310 Q1150 280 1160 250 Q1120 240 1074 238 Z" fill="#86704f" />
        <g stroke="#6b5640" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M1110 262q-6 18 2 34" /><path d="M1168 244q8 16 0 30" /><path d="M1138 300q-2 12 4 22" />
        </g>
        <rect x="1222" y="190" width="5" height="120" fill="#fff" opacity="0.6" />
        <ellipse cx="1140" cy="186" rx="112" ry="14" fill="#6faf73" />
        <rect x="1132" y="120" width="16" height="66" rx="4" fill="#6b5640" />
        <g fill="#3e8e5a"><circle cx="1140" cy="104" r="50" /><circle cx="1096" cy="128" r="34" /><circle cx="1186" cy="124" r="36" /></g>
        <g fill="#5fae6e"><circle cx="1120" cy="84" r="28" /><circle cx="1166" cy="88" r="26" /><circle cx="1090" cy="118" r="18" /></g>
        <g fill="#8fcb8a"><circle cx="1112" cy="76" r="10" /><circle cx="1160" cy="80" r="9" /></g>
        <path d="M0 270 Q180 230 360 258 T720 250 T1080 262 T1440 246 V360 H0 Z" fill="#bfe0b6" />
        <g fill="#a9d3a0">
          <circle cx="60" cy="262" r="20" /><circle cx="96" cy="256" r="16" /><circle cx="420" cy="258" r="18" /><circle cx="452" cy="252" r="14" />
          <circle cx="820" cy="256" r="20" /><circle cx="858" cy="262" r="15" /><circle cx="1320" cy="250" r="18" /><circle cx="1352" cy="246" r="14" />
        </g>
        <path d="M0 300 Q240 268 480 292 T960 286 T1440 290 V360 H0 Z" fill="#7dbb80" />
        <g fill="#6aae70">
          <circle cx="200" cy="288" r="22" /><circle cx="240" cy="280" r="18" /><circle cx="270" cy="290" r="14" /><circle cx="640" cy="286" r="20" />
          <circle cx="676" cy="280" r="16" /><circle cx="1000" cy="286" r="22" /><circle cx="1040" cy="280" r="18" /><circle cx="1240" cy="290" r="20" />
        </g>
        <path d="M0 330 Q200 306 420 324 T860 318 T1440 326 V360 H0 Z" fill="#3f7f57" />
        <g fill="#356e4b">
          <path d="M90 330 l18-46 18 46z" /><path d="M120 332 l14-36 14 36z" /><path d="M540 326 l16-40 16 40z" />
          <path d="M1120 328 l18-44 18 44z" /><path d="M1150 330 l13-32 13 32z" /><path d="M1380 330 l16-40 16 40z" />
        </g>
        <rect y="348" width="1440" height="12" fill="#f4f8f1" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}

export function ForestFooter() {
  return (
    <footer className="relative mt-16 h-[150px] overflow-hidden">
      <svg aria-hidden="true" viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <path d="M0 70 Q200 40 420 64 T860 58 T1440 62 V150 H0 Z" fill="#bfe0b6" />
        <g fill="#a9d3a0"><circle cx="140" cy="62" r="22" /><circle cx="180" cy="56" r="16" /><circle cx="700" cy="58" r="20" /><circle cx="1260" cy="56" r="22" /></g>
        <path d="M0 104 Q260 76 540 98 T1080 92 T1440 98 V150 H0 Z" fill="#6aae70" />
        <g fill="#3f7f57">
          <path d="M60 120 l20-50 20 50z" /><path d="M96 124 l15-38 15 38z" /><path d="M380 118 l18-44 18 44z" />
          <path d="M980 120 l20-48 20 48z" /><path d="M1016 124 l14-34 14 34z" /><path d="M1340 118 l18-46 18 46z" />
        </g>
        <rect y="118" width="1440" height="32" fill="#3f7f57" />
      </svg>
      <p className="absolute inset-x-0 bottom-3 text-center text-[13px] font-bold text-moss">
        Hợp Âm Free · hợp âm mọc lên từ cộng đồng chơi đàn ·{" "}
        <a href="/agents" className="underline">Dành cho AI agent</a>
      </p>
    </footer>
  );
}
