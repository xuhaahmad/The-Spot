import { Link } from 'react-router'
import { ArrowRight, BookOpen, Eye, Headphones, HelpCircle, Laptop, ListChecks, PartyPopper, Users } from 'lucide-react'
import CafeCard from '../components/CafeCard.jsx'
import PhotoCredit from '../components/PhotoCredit.jsx'
import Reveal from '../components/Reveal.jsx'
import { getCafeDataset } from '../data/index.js'
import { PHOTOS } from '../data/photos.js'
import './HomePage.css'

// `purpose` pre-fills the first questionnaire answer (see FindPage).
// `layout` places the tile in the photo grid (see .plan-grid in HomePage.css).
const PLANS = [
  {
    purpose: 'group',
    title: 'Reunions',
    text: 'Room for the whole group to get together.',
    icon: PartyPopper,
    photo: PHOTOS.reunion,
    layout: 'wide',
  },
  {
    purpose: 'study',
    title: 'Study session',
    text: 'Somewhere calm enough to focus for a few hours.',
    icon: BookOpen,
    photo: PHOTOS.study,
    layout: 'tall',
  },
  {
    purpose: 'friends',
    title: 'Catching up',
    text: 'Easy conversation over a good cup.',
    icon: Users,
    photo: PHOTOS.latte,
    layout: 'tall',
  },
  {
    purpose: 'work',
    title: 'Remote work day',
    text: 'A table, a coffee and room to get things done.',
    icon: Laptop,
    photo: PHOTOS.work,
  },
  {
    purpose: 'solo',
    title: 'Solo reset',
    text: 'A quiet corner and some time to yourself.',
    icon: Headphones,
    photo: PHOTOS.solo,
  },
]

// Quick-start links in the hero, one tap into the questionnaire.
const QUICK_PLANS = [
  { purpose: 'study', label: 'Study session' },
  { purpose: 'friends', label: 'Catch-up' },
  { purpose: 'group', label: 'Reunion' },
  { purpose: 'work', label: 'Work day' },
  { purpose: 'solo', label: 'Solo reset' },
]

const STEPS = [
  {
    title: 'Tell us the plan',
    text: 'Pick a mood, what you’re heading out for, a rough budget in PKR and the areas that suit you.',
  },
  {
    title: 'See ranked matches',
    text: 'Cafés are scored against your answers with a simple, transparent formula — no chatbot guesswork.',
  },
  {
    title: 'Know why it fits',
    text: 'Every suggestion explains what matched, and says plainly what we couldn’t confirm.',
  },
]

const PRINCIPLES = [
  {
    icon: Eye,
    title: 'No fake ratings',
    text: 'No made-up stars, reviews or popularity numbers. Ever.',
  },
  {
    icon: HelpCircle,
    title: 'Unknown means unknown',
    text: 'If we couldn’t confirm Wi-Fi, parking or prices, we say so instead of guessing.',
  },
  {
    icon: ListChecks,
    title: 'Scores you can read',
    text: 'A documented formula, so you can see exactly why a café ranks where it does.',
  },
]

const FEATURED_COUNT = 3

// A few cafés with recent sources, shown as a taste of the guide (not a ranking).
function getFeaturedCafes() {
  return getCafeDataset()
    .cafes.filter((cafe) => cafe.dataConfidence !== 'low' && cafe.purposes.length > 0)
    .slice(0, FEATURED_COUNT)
}

const UNSPLASH_PHOTOS = [PHOTOS.hero, PHOTOS.calm, PHOTOS.study, PHOTOS.work, PHOTOS.reunion, PHOTOS.solo]

function Hero() {
  const { hero } = PHOTOS
  return (
    <section className="hero" aria-labelledby="hero-title">
      <picture className="hero__media">
        <source media="(max-width: 700px)" srcSet={hero.tallSrc} width={hero.tallWidth} height={hero.tallHeight} />
        {/* Decorative backdrop: the headline carries the meaning, so alt is empty */}
        <img src={hero.src} width={hero.width} height={hero.height} alt="" fetchPriority="high" decoding="async" />
      </picture>
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow">A café guide for Islamabad</p>
          <h1 id="hero-title" className="serif hero__title">
            There's a spot for that.
          </h1>
          <p className="hero__lede">
            Tell us your mood, budget, plan and favorite part of town. We’ll rank cafés that fit and show you
            exactly why.
          </p>
          <div className="hero__actions">
            <Link to="/find" className="btn btn--primary btn--large">
              Find your spot
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/explore" className="btn btn--on-photo btn--large">
              Browse all cafés
            </Link>
          </div>
          <nav className="hero__quick" aria-label="Start with a plan">
            <span className="hero__quick-label">Or start with</span>
            <ul>
              {QUICK_PLANS.map((plan) => (
                <li key={plan.purpose}>
                  <Link to={`/find?purpose=${plan.purpose}`} className="hero__quick-link">
                    {plan.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <PhotoCredit credit={hero.credit} className="photo-credit--on-photo hero__credit" />
    </section>
  )
}

function PlanTile({ plan, index }) {
  const { icon: Icon, photo } = plan
  return (
    <Reveal as="li" delay={index * 70} className={`plan-tile plan-tile--${plan.layout ?? 'default'}`}>
      <Link to={`/find?purpose=${plan.purpose}`} className="plan-tile__link">
        <img
          className="plan-tile__image"
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="plan-tile__shade" aria-hidden="true" />
        <span className="plan-tile__content">
          <Icon size={20} aria-hidden="true" className="plan-tile__icon" />
          <span className="plan-tile__title serif">{plan.title}</span>
          <span className="plan-tile__text">{plan.text}</span>
          <span className="plan-tile__cta" aria-hidden="true">
            Start here <ArrowRight size={15} />
          </span>
        </span>
      </Link>
    </Reveal>
  )
}

export default function HomePage() {
  const featured = getFeaturedCafes()

  return (
    <>
      <Hero />

      <section className="section how" aria-labelledby="how-title">
        <div className="container how__inner">
          <Reveal className="how__head">
            <p className="eyebrow">How it works</p>
            <h2 id="how-title" className="serif section__title">
              Your mood. Your place.
            </h2>
            <p className="muted how__lede">Three short steps, and every result explains itself.</p>
          </Reveal>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 90} className="steps__item">
                <span className="steps__number serif" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="steps__title">{step.title}</h3>
                <p className="muted">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section plans" aria-labelledby="plans-title">
        <div className="container">
          <Reveal className="section__head section__head--split">
            <div>
              <p className="eyebrow">Start with the plan</p>
              <h2 id="plans-title" className="serif section__title">
                What are you heading out for?
              </h2>
            </div>
            <p className="muted section__aside">
              Every outing needs something different. Pick one to jump straight into your matches.
            </p>
          </Reveal>
          <ul className="plan-grid">
            {PLANS.map((plan, index) => (
              <PlanTile key={plan.purpose} plan={plan} index={index} />
            ))}
          </ul>
          <p className="photo-note muted">Photos are illustrative and don’t show the cafés listed in The Spot.</p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section section--muted featured" aria-labelledby="featured-title">
          <div className="container">
            <Reveal className="section__head section__head--split">
              <div>
                <p className="eyebrow">From the guide</p>
                <h2 id="featured-title" className="serif section__title">
                  A few spots to start with
                </h2>
              </div>
              <p className="muted section__aside">
                Picked because they have the most recent sources. Not a ranking, and never a rating.
              </p>
            </Reveal>
            <ul className="cafe-grid">
              {featured.map((cafe, index) => (
                <Reveal as="li" key={cafe.id} delay={index * 80}>
                  <CafeCard cafe={cafe} />
                </Reveal>
              ))}
            </ul>
            <div className="featured__more">
              <Link to="/explore" className="btn btn--secondary">
                Explore all cafés
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section honest" aria-labelledby="honest-title">
        <div className="container honest__inner">
          <Reveal className="honest__media">
            <img
              src={PHOTOS.calm.src}
              width={PHOTOS.calm.width}
              height={PHOTOS.calm.height}
              alt={PHOTOS.calm.alt}
              loading="lazy"
              decoding="async"
            />
            <PhotoCredit credit={PHOTOS.calm.credit} />
          </Reveal>
          <div className="honest__content">
            <Reveal>
              <p className="eyebrow">Honest by design</p>
              <h2 id="honest-title" className="serif section__title">
                Recommendations you can trust a little more.
              </h2>
            </Reveal>
            <ul className="principles">
              {PRINCIPLES.map(({ icon: Icon, title, text }, index) => (
                <Reveal as="li" key={title} delay={index * 80} className="principle">
                  <span className="principle__icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="principle__title">{title}</h3>
                    <p className="muted">{text}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section cta" aria-labelledby="cta-title">
        <div className="container">
          <Reveal className="cta-band">
            <div>
              <p className="eyebrow cta-band__eyebrow">Ready when you are</p>
              <h2 id="cta-title" className="serif cta-band__title">
                Your next favorite is out there.
              </h2>
            </div>
            <Link to="/find" className="btn btn--large cta-band__btn">
              Find your spot
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </Reveal>
          <p className="photo-note muted credits">
            Photography by{' '}
            {UNSPLASH_PHOTOS.map((photo, index) => (
              <span key={photo.credit.name}>
                <a href={photo.credit.url} target="_blank" rel="noopener noreferrer">
                  {photo.credit.name}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                {index < UNSPLASH_PHOTOS.length - 1 ? ', ' : ''}
              </span>
            ))}{' '}
            on Unsplash. Latte art by The Spot.
          </p>
        </div>
      </section>
    </>
  )
}
