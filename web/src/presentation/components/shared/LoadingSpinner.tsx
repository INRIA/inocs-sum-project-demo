interface Props {
  message?: string;
}
export default function LoadingSpinner({ message = 'Loading…' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-text">
      <svg className="animate-spin h-8 w-8 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  );
}
