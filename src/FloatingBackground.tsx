export function FloatingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute top-1/4 left-0 w-96 h-96 opacity-10 bg-float-1">
        <img
          src="/background/telegram-logo.gif"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      <div className="absolute bottom-1/4 right-0 w-96 h-96 opacity-10 bg-float-2">
        <img
          src="/background/fragment-logo.gif"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-10 bg-float-3">
        <img
          src="/background/ton-logo.gif"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 opacity-10 bg-float-4">
        <img
          src="/background/votre-image.gif"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
