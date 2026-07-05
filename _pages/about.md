---
permalink: /
title: "Zhiyuan Yu"
excerpt: "M.S. student at Southeast University working on ISAC, RIS, and MIMO signal detection."
author_profile: true
hide_title: true
redirect_from:
  - /about/
  - /about.html
---

<div class="home-page">
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__content">
      <p class="home-eyebrow">Wireless Algorithms · ISAC · Standards</p>
      <h1 id="home-hero-title">Zhiyuan Yu</h1>
      <p class="home-hero__subtitle">I work on wireless communication algorithms, integrated sensing and communication, and receiver designs for next-generation networks.</p>
      <p>
        I am completing my M.S. degree in Information Science and Technology at Southeast University, advised by Prof. Hong Ren and Prof. Cunhua Pan. My recent work focuses on practical signal processing and optimization methods for ISAC systems, with an increasing interest in wireless standards and industrial applications.
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
    <p>
      I built my academic foundation at Southeast University, where I completed my undergraduate study and continued into graduate research in Information Science and Technology. This site is also a personal archive for work, research, travel, graduation memories, and everyday observations.
    </p>
    <div class="home-facts" aria-label="Personal and academic background">
      <div class="home-fact">
        <strong>Background</strong>
        <span>B.S. in Information Science and Technology, Southeast University, 2023. M.S., Southeast University, 2023-2026. <!-- Add the high school name below when ready. --> High school: [Add high school name here]</span>
      </div>
      <div class="home-fact">
        <strong>Name &amp; Hometown</strong>
        <span>My given name Zhiyuan (致远) comes from “淡泊以明志，宁静以致远.” My grandfather was named Mingzhi (明志), so I was named Zhiyuan (致远). I am from Hefei, Anhui, and have spent my university years studying and living in Nanjing.</span>
      </div>
      <div class="home-fact">
        <strong>Next Step</strong>
        <span>I will join the ZTE Algorithms Department under the Blue Sword Program, working on wireless standards and related algorithm development.</span>
      </div>
    </div>
    <figure class="home-about-photo">
      <img src="{{ '/images/home/graduation-campus.jpg' | relative_url }}" alt="Zhiyuan Yu in graduation gown at Southeast University" loading="lazy" decoding="async">
    </figure>
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
        <p class="research-card__note">ESI Hot Paper and a highly read IEEE TCOM paper.</p>
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
      <img src="{{ '/images/home/award-ceremony.jpg' | relative_url }}" alt="Zhiyuan Yu at an award ceremony" loading="lazy" decoding="async">
      <img src="{{ '/images/home/graduation-campus.jpg' | relative_url }}" alt="Graduation memory at Southeast University" loading="lazy" decoding="async">
      <img src="{{ '/images/home/presentation-classroom.jpg' | relative_url }}" alt="Classroom presentation moment" loading="lazy" decoding="async">
    </div>
  </section>

  <section class="home-section home-section--snapshot" aria-labelledby="academic-snapshot">
    <p class="home-eyebrow">Snapshot</p>
    <h2 id="academic-snapshot">Academic Snapshot</h2>
    <div class="home-snapshot-grid">
      <article>
        <h3>Projects</h3>
        <p>Cooperative ISAC simulation platform with China Mobile; uplink ISAC receiver algorithm design with Huawei.</p>
      </article>
      <article>
        <h3>Service</h3>
        <p>Reviewer for IEEE journals including TWC, TCOM, TMC, TCCN, JSTSP, and TVT; TPC member for ICC, WCNC, and PIMRC.</p>
      </article>
      <article>
        <h3>Awards</h3>
        <p>President's Scholarship, National Scholarship, Xiaomi Scholarship, Huawei Scholarship, and mathematical modeling awards.</p>
      </article>
    </div>
  </section>

</div>
