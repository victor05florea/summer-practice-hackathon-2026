interface Props {
  message: string;
  onDismiss: () => void;
}

export default function DailyTipBanner({ message, onDismiss }: Props) {
  return (
    <div className="max-w-2xl mx-auto mt-4 px-4">
      <div className="p-3 pr-10 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center shadow-lg relative">
        <p className="text-sm text-purple-200 italic">"{message}"</p>
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 w-6 h-6 rounded-full text-purple-300 hover:text-white hover:bg-purple-500/20 flex items-center justify-center text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
