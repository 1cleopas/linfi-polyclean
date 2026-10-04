import { images, videos } from '../data/content'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

export default function WorkVideo() {
  return (
    <section className="section" id="our-work-video">
      <div className="wrap">
        <Reveal>
          <SectionHeader
            title="Watch the work"
            subtitle="A look at LINFI POLYCLEAN cleaning a tank on site."
          />
        </Reveal>
        <Reveal>
          <div className="work-video">
            <video
              controls
              playsInline
              preload="metadata"
              poster={images.hero}
            >
              <source src={videos.work} type="video/mp4" />
              Your browser cannot play this video.
            </video>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
