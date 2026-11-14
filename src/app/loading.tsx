// 화면을 불러오는 동안 보이는 표시.
export default function Loading() {
  return (
    <div role="status" className="flex min-h-[70vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5D9DE] border-t-ink" aria-hidden="true" />
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
