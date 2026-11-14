import type { PublicReview } from "@/types";

// 실제로 등록된 공개 리뷰 목록. 리뷰가 없으면 구역을 그리지 않는다.
// 서비스 상세와 전문가 화면이 함께 쓴다.
export function ReviewSection({
  reviews,
  total,
  replyFrom,
}: {
  /** 최근 것부터 */
  reviews: PublicReview[];
  /** 공개 리뷰 전체 수 (reviews 는 그중 최근 일부일 수 있다) */
  total: number;
  /** 답글을 단 전문가 이름 */
  replyFrom: string;
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black tracking-[-0.03em]">
        리뷰 <span className="font-display text-[28px] font-normal">{total}</span>
      </h2>
      <ul className="border-t border-[#E2E5E9]">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-2.5 border-b border-[#E2E5E9] py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
              <span role="img" aria-label={`5점 만점에 ${review.rating}점`} className="font-black tracking-[0.08em]">
                {"★".repeat(review.rating)}
                <span className="text-[#B9BEC5]">{"★".repeat(5 - review.rating)}</span>
              </span>
              <span className="font-bold">{review.name}</span>
              <time dateTime={review.createdAt} className="text-[#56606B]">
                {review.createdAt.replaceAll("-", ".")}
              </time>
            </div>
            {review.content && (
              <p className="whitespace-pre-line text-[17px] leading-[1.7] text-[#3A3A37] [overflow-wrap:anywhere]">
                {review.content}
              </p>
            )}
            {review.reply && (
              <div className="mt-1 rounded-[20px] bg-paper p-5">
                <p className="text-sm font-black">{replyFrom}님의 답글</p>
                <p className="mt-1.5 whitespace-pre-line text-[15px] leading-[1.7] text-[#3A3A37] [overflow-wrap:anywhere]">
                  {review.reply}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
      {total > reviews.length && (
        <p className="text-[15px] text-[#56606B]">최근 리뷰 {reviews.length}개를 보여 드립니다.</p>
      )}
    </section>
  );
}
