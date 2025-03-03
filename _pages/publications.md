---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

<!-- { if author.googlescholar }
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{ endif } -->

{% if author.google_scholar %}
<div class="notice--info" style="margin-top:1.5rem;">
🔍 更多研究成果请访问我的 <a href="{{ author.google_scholar }}" target="_blank" rel="noopener noreferrer">Google Scholar 主页</a>
</div>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
