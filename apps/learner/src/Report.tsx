import { AREA_ICON, AREA_KO, GOOD, type AreaResult, type Report, type StepRef } from './reportCalc';

const VERDICT: Record<AreaResult['level'], string> = { good: '잘했어요!', mid: '조금만 더 해요', low: '더 연습해요', none: '아직 기록이 없어요' };

/** 6차시 결과 리포트: 영역별 결과와 [더 연습해요]. 연습할 활동이 없는 영역은 6차시 활동 다시 풀기만 보여 준다 */
export function ReportView({ title, report, practice, onPractice, onRetry, onBack }: {
  title: string; report: Report; practice: (a: AreaResult) => StepRef[];
  onPractice: (a: AreaResult, list: StepRef[]) => void; onRetry: (s: StepRef) => void; onBack: () => void;
}) {
  const weak = report.areas.filter((a) => a.pct != null && a.pct < GOOD);
  return (
    <>
      <button className="mx-link" onClick={onBack}>← 목록으로</button>
      <h1>{title} · {report.reportLesson}차시 결과</h1>
      <div className="mx-card mx-rep-top">
        <div>
          <span className="mx-chip">오늘의 결과</span>
          <p className="mx-rep-msg">{report.pct == null ? '활동을 마쳤어요!' : weak.length === 0 ? '모든 영역을 잘 해냈어요! 🎉' : weak.length === report.areas.length ? '천천히 다시 해 보면 훨씬 좋아질 거예요 💪' : '잘한 부분도 많아요. 조금만 더 연습해 볼까요?'}</p>
          {!report.complete && <p className="mx-muted">아직 하지 않은 활동이 있어요. 모두 마치면 결과가 더 정확해져요.</p>}
        </div>
        <div className="mx-rep-big">
          <b>{report.pct == null ? '-' : report.pct}<small>{report.pct == null ? '' : '%'}</small></b>
          <span className="mx-rep-stars" aria-label={`별 ${report.stars}개`}>{'★'.repeat(report.stars)}{'☆'.repeat(3 - report.stars)}</span>
          {report.total > 0 && <span className="mx-muted">{report.ok} / {report.total} 맞혔어요</span>}
        </div>
      </div>
      <div className="mx-rep-grid">
        {report.areas.map((a) => {
          const list = a.pct != null && a.pct < GOOD ? practice(a) : [];
          return (
            <div key={a.area} className={'mx-card mx-rep-area mx-lv-' + a.level}>
              <div className="mx-rep-h"><span className="mx-rep-ico" aria-hidden="true">{AREA_ICON[a.area]}</span><b>{AREA_KO[a.area]}</b><span className={'mx-rep-verdict mx-lv-' + a.level}>{VERDICT[a.level]}</span></div>
              <div className="mx-rep-num">{a.pct == null ? '참여 완료' : <>{a.pct}<small>%</small></>}</div>
              <div className="mx-rep-bar" role="img" aria-label={`${AREA_KO[a.area]} ${a.pct ?? 0}%`}><i style={{ width: (a.pct ?? 0) + '%' }} /></div>
              {a.total > 0 && <p className="mx-muted">{a.ok} / {a.total} 맞혔어요</p>}
              <ul className="mx-rep-steps">
                {a.steps.map((s) => (
                  <li key={s.idx}><span>{s.name}</span><span className="mx-muted">{s.total > 0 ? `${s.ok}/${s.total}` : s.pct == null && s.ok === 0 ? '참여' : ''}</span>
                    {s.pct != null && s.pct < GOOD && <button className="mx-link" onClick={() => onRetry(s)}>다시 풀기</button>}</li>
                ))}
              </ul>
              {a.pct != null && a.pct < GOOD && (
                <button className="mx-btn mx-more" disabled={!list.length} onClick={() => onPractice(a, list)}>
                  {list.length ? `더 연습해요 (${list.length}개 활동)` : '더 연습할 활동이 아직 없어요'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mx-rep-foot"><button className="mx-btn" onClick={onBack}>목록으로</button></div>
    </>
  );
}
