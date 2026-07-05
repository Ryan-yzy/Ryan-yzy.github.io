---
permalink: /
title: "Zhiyuan Yu"
excerpt: "Research Engineer in ZTE Communication, working on ISAC and 3GPP."
author_profile: true
hide_title: true
redirect_from:
  - /about/
  - /about.html
---

<div class="home-page">
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__content">
      <p class="home-eyebrow">Wireless Algorithms · ISAC · 3GPP</p>
      <h1 id="home-hero-title">Zhiyuan Yu</h1>
      <p class="home-hero__subtitle">Research Engineer in ZTE Communication, working on integrated sensing and communication and 3GPP standardization.</p>
      <p>
        This website is not only a research homepage, but also a small personal archive for work, study, travel, graduation memories, and everyday observations.
      </p>
      <div class="home-hero__actions" aria-label="Homepage quick links">
        <a class="btn home-btn home-btn--primary" href="{{ '/publications/' | relative_url }}">View Publications</a>
        <a class="btn home-btn home-btn--secondary" href="{{ '/life-notes/' | relative_url }}">Life &amp; Notes</a>
      </div>
    </div>
    <figure class="home-hero__media">
      <!-- Replace this image with a professional portrait or a warm personal photo. -->
      <img src="{{ '/images/home/presentation-classroom.jpg' | relative_url }}" alt="Zhiyuan Yu presenting in a classroom" loading="lazy" decoding="async">
    </figure>
  </section>

  <section class="home-section home-section--about" aria-labelledby="about-me">
    <p class="home-eyebrow">About</p>
    <h2 id="about-me">About Me</h2>
    <div class="home-about-panel">
      <div class="home-about-prose">
        <p>
          I am Zhiyuan Yu, a Research Engineer in ZTE Communication working on integrated sensing and communication and 3GPP standardization. My given name, Zhiyuan (致远), comes from the phrase “淡泊以明志，宁静以致远”; my grandfather was named Mingzhi (明志), so my family named me Zhiyuan (致远). I was born and raised in Hefei, Anhui, studied at Hefei No.1 High School, and later moved to Nanjing, where I have studied and lived for seven years.
        </p>
        <p>
          I received my B.S. degree in Information Science and Technology from Southeast University in 2023, and continued my M.S. study at Southeast University from 2023 to 2026 under the supervision of Prof. Hong Ren and Prof. Cunhua Pan. My work centers on integrated sensing and communication, receiver algorithms, RIS-aided systems, and optimization methods.
        </p>
        <p>
          This website is not only a research homepage, but also a small personal archive for work, study, travel, graduation memories, and everyday observations.
        </p>
      </div>
      <aside class="home-about-aside" aria-label="About Me photo">
        <figure class="home-about-aside__figure">
          <img src="{{ '/images/home/award-ceremony.jpg' | relative_url }}" alt="Zhiyuan Yu receiving a scholarship award" loading="lazy" decoding="async">
        </figure>
        <p class="home-about-aside__caption">Scholarship award moment at Southeast University.</p>
        <figure class="home-about-aside__figure home-about-aside__figure--secondary">
          <img src="{{ '/images/home/graduation-school-building.jpg' | relative_url }}" alt="Zhiyuan Yu in graduation gown in front of the School of Information Science and Engineering" loading="lazy" decoding="async">
        </figure>
        <p class="home-about-aside__caption">Graduation memory at the School of Information Science and Engineering.</p>
      </aside>
    </div>
  </section>

  <section class="home-section" aria-labelledby="selected-research">
    <p class="home-eyebrow">Research</p>
    <h2 id="selected-research">Selected Research</h2>
    <div class="research-card-grid">
      <article class="research-card">
        <p class="research-card__keywords">Active RIS / ISAC / Beamforming</p>
        <h3>Active RIS Aided ISAC Systems</h3>
        <p>
          This work studies how active RIS can mitigate multiplicative fading in the sensing link of ISAC systems, with beamforming design, radar SNR scaling analysis, and deployment insights.
        </p>
        <p class="research-card__note">ESI Hot Paper and IEEE TCOM Most Popular paper for years.</p>
        <div class="research-card__links">
          <a href="{{ '/files/Active_RIS-Aided_ISAC_Systems_Beamforming_Design_and_Performance_Analysis.pdf' | relative_url }}">Paper</a>
          <a href="https://github.com/Ryan-yzy/Active-RIS-ISAC">Code</a>
          <a href="{{ '/files/Active_RIS_Aided_ISAC_Slides.pdf' | relative_url }}">Slides</a>
        </div>
      </article>

      <article class="research-card">
        <p class="research-card__keywords">Uplink ISAC / Receiver Design / Homotopy Optimization</p>
        <h3>Uplink ISAC Receiver Designs</h3>
        <p>
          I develop low-complexity uplink receiver designs that jointly support communication signal detection and radar echo processing under mutual interference.
        </p>
        <p class="research-card__note">Includes IEEE WCL, ICC Best Paper Award work, and IEEE TWC journal extension.</p>
        <div class="research-card__links">
          <a href="{{ '/files/Uplink_ISAC5.pdf' | relative_url }}">Paper</a>
          <a href="https://github.com/Ryan-yzy/Codes_For_Uplink_ISAC_Receiver_Design">Code</a>
          <a href="{{ '/files/Uplink_ISAC_ICC_2026_final.pdf' | relative_url }}">Slides</a>
        </div>
      </article>
    </div>
  </section>

  <section class="home-life-preview" aria-labelledby="life-notes-preview">
    <div class="home-life-preview__copy">
      <p class="home-eyebrow">Life &amp; Notes</p>
      <h2 id="life-notes-preview">Life &amp; Notes</h2>
      <p>
        Life &amp; Notes records travels, graduation memories, daily observations, and the small moments beyond research.
      </p>
      <a class="btn home-btn home-btn--warm" href="{{ '/life-notes/' | relative_url }}">Read Life &amp; Notes</a>
    </div>
    <div class="home-life-preview__gallery" aria-label="Life and Notes photo preview">
      {% assign home_note_count = 0 %}
      {% for post in site.posts %}
        {% if post.categories contains "life-notes" %}
          {% if home_note_count == 3 %}
            {% break %}
          {% endif %}
          {% assign teaser = post.header.teaser %}
          {% if teaser %}
            <a class="home-life-preview__cover" href="{{ post.url | relative_url }}" aria-label="Read {{ post.title | strip_html | escape }}">
              <img src="{% if teaser contains '://' %}{{ teaser }}{% else %}{{ teaser | prepend: '/images/' | relative_url }}{% endif %}" alt="{{ post.title | strip_html | escape }}" loading="lazy" decoding="async">
            </a>
            {% assign home_note_count = home_note_count | plus: 1 %}
          {% endif %}
        {% endif %}
      {% endfor %}
    </div>
  </section>
</div>
