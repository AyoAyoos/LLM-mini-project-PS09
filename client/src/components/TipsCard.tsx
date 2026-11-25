import { Icon } from './icons';

const TIPS = [
  { icon: 'users' as const, title: 'Characters', text: 'Use real names or kinds, like “a brave mouse”. Every character gets its own personality.' },
  { icon: 'heart' as const, title: 'Morals', text: 'Pick a preset or write your own. The story shows the lesson through choices, then names it once.' },
  { icon: 'moon' as const, title: 'Bedtime pace', text: 'Younger children get shorter sentences and gentler words. Every story ends happily.' },
];

export function TipsCard() {
  return (
    <section className="card tips-card" aria-labelledby="tips-title">
      <div className="card-header">
        <span className="icon-tile" aria-hidden="true">
          <Icon name="info" size={14} />
        </span>
        <h2 id="tips-title" className="card-title">
          How it works
        </h2>
      </div>
      <ul className="tips-list">
        {TIPS.map((tip) => (
          <li key={tip.title} className="tip-row">
            <Icon name={tip.icon} className="muted" />
            <div>
              <p className="tip-title">{tip.title}</p>
              <p className="detail-copy muted">{tip.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
