---
permalink: /tutoring/
title: "Tutoring"
author_profile: true
redirect_from:
  - /tutoring.html
---

<html>
<head>
  <meta charset="utf-8">
  <title>Two-Column Tutor Layout</title>
  <style>
    /* Container uses Flexbox for two side-by-side columns */
    .container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: sans-serif;
    }

    /* Middle column (Name, About, Education) */
    .middle-column {
      flex: 1;
      margin-right: 40px; /* Spacing between columns */
    }

    /* Right column (What I Tutor) */
    .right-column {
      flex: 0 0 300px;
    }

    /* Simple card style for the “What I Tutor” boxes */
    .card {
      border-radius: 26px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 1px 3px 19px 0px #D8E6F890;
    }

    /* Basic typography tweaks */
    h1, h2, h3 {
      margin: 0 0 10px 0;
    }
    .middle-column h1 {
      font-size: 2rem;
    }
    .middle-column h2 {
      font-size: 1.2rem;
      letter-spacing: 1px;
      margin-top: 20px;
    }
    p {
      line-height: 1.5;
      margin: 0 0 10px 0;
    }

    /* EDUCATION SECTION STYLING */
    .education-section {
      /* background: #f9f9f9; */ /* subtle background color (commented out) */
      border-radius: 8px;       /* smooth corners */
      padding: 20px;            /* space around content */
      margin: 20px 0;           /* spacing from other elements */
    }
    .education-section h2 {
      margin-top: 0;
      font-size: 1.2rem;
      color: #333;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .education-section h2::before {
      content: "🎓 ";
      font-size: 1.2rem;
      vertical-align: left;
      margin-right: 5px;
    }
    .current-status {
      font-weight: bold;
      color: #444;
    }

    /* Testimonials section */
    .testimonials-section {
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      font-family: sans-serif;
    }
    .testimonials-section h2 {
      margin: 0 0 20px 0;
      font-size: 1.4rem;
      letter-spacing: 1px;
      text-align: center;
    }

    /* Grid container for testimonials: 3 columns, 20px gap */
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    /* Individual testimonial container */
    .testimonial {
      background: #f7f7f7;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 1px 3px 10px rgba(0, 0, 0, 0.05);
      position: relative;
      /* Removed margin-bottom so grid's gap is used instead */
    }

    /* Short text: visible by default */
    .testimonial-short {
      margin: 0 0 10px;
      line-height: 1.4;
    }
    /* Full text: hidden by default */
    .testimonial-full {
      display: none;
      margin: 0 0 10px;
      line-height: 1.4;
    }

    /* Attribution or final line in the testimonial */
    .testimonial p:last-child {
      margin: 0;
      text-align: right;
      font-style: italic;
      color: #666;
    }

    /* Read More button styling */
    .read-more-btn {
      /* background-color: #007BFF;  <-- Uncomment or choose a different color */
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-top: 10px;
    }
    .read-more-btn:hover {
      background-color: #0056b3;
    }

    /*
      ====================
      Responsive Behavior
      ====================
      When the screen width is 800px or less, we'll stack
      the columns vertically and adjust the testimonials grid.
    */
    @media (max-width: 800px) {
      .container {
        display: flex;
        justify-content: space-between;
        /* Add or ensure this is set: */
        align-items: flex-start;
        }
      .middle-column {
        margin-right: 0;
        margin-bottom: 20px;  /* spacing between the middle & right columns */
      }
      .right-column {
        flex: none;
        width: 100%;
      }
      .testimonials-grid {
        grid-template-columns: 1fr; /* stack testimonials in one column */
      }
    }

  </style>
</head>
<body>

  <div class="container">
    <!-- Middle Column (Name, About, Education) -->
    <div class="middle-column">
      <h2>A Bit About Me</h2>
      <p>
        I’ve been independently tutoring mathematics and statistics for the past
        <b>six years</b>. I believe that tackling new problems and asking questions
        are the best ways to learn. My goal is to teach all my students how to
        think creatively and analytically.
      </p>

      <!-- EDUCATION SECTION -->
      <div class="education-section">
        <h2>Education</h2>
        <p class="current-status">Incoming Statistics PhD Student</p>
        <p>Mathematics and Statistics BS at Rice University</p>
      </div>
      <!-- END EDUCATION SECTION -->
    </div>

    <!-- Right Column (What I Tutor) -->
    <div class="right-column">
      <h2>What I Tutor</h2>
      <div class="card">
        <h3>Mathematics</h3>
        <ul>
          <li>Algebra I &amp; II</li>
          <li>Trigonometry</li>
          <li>Geometry</li>
          <li>Precalculus</li>
          <li>Calculus I &amp; II</li>
          <li>Multivariable Calculus</li>
          <li>Linear Algebra</li>
          <li>Differential Equations</li>
          <li>Real Analysis</li>
          <li>SAT &amp; ACT</li>
        </ul>
      </div>

      <div class="card">
        <h3>Statistics</h3>
        <ul>
          <li>Probability</li>
          <li>Statistical Inference</li>
          <li>Machine Learning</li>
        </ul>
      </div>
    </div>

  </div>

  <!-- TESTIMONIALS SECTION -->
  <div class="testimonials-section">
    <h2>Testimonials</h2>

    <!-- Grid container: 3 columns -->
    <div class="testimonials-grid">

      <!-- Testimonial #1 -->
      <div class="testimonial">
        <p class="testimonial-short">
          “Josh Davis is an exceptional teacher! He has tutored my daughter in both Precalculus and...”
        </p>
        <p class="testimonial-full">
          “Josh Davis is an exceptional teacher! He has tutored my daughter in both Precalculus and
          Physics. She says Josh explains complicated topics in a really clear way, making them easy
          for her to understand. He patiently goes through problems, shows why the solution works,
          and helps her achieve a deeper understanding of the material. It’s clear Josh really loves
          math and science. Beyond greater understanding, my daughter has gained a great deal of
          confidence through her work with Josh. She feels prepared to take Calculus next year and
          will work with Josh again. My daughter has found Josh to be very easy to work with on
          Zoom while he’s away at college. He’s been flexible with scheduling extra meetings when
          a test is coming up, even when he’s in the middle of his own exams, or rescheduling when
          she’s had a conflict. Josh also provides very clear communication about how the sessions
          are going. In addition to being brilliant, Josh is just plain nice. We feel very lucky to
          work with him!”
        </p>
        <p>— Jill H, Parent</p>
        <button class="read-more-btn" onclick="toggleTestimonial(this)">Read More</button>
      </div>

      <!-- Testimonial #2 -->
      <div class="testimonial">
        <p class="testimonial-short">
          “Josh is an incredibly patient and passionate math tutor! Not only is he so...”
        </p>
        <p class="testimonial-full">
          “Josh is an incredibly patient and passionate math tutor! Not only is he so excited to get
          to talk about a subject that is meaningful to him, he paid close attention to questions I
          had and ensured a deep, conceptual understanding of calculus, all in a short amount of
          time. I couldn’t recommend working with Josh enough if you want to really grasp math from
          a deeper level!”
        </p>
        <p>— Sarah F, Student</p>
        <button class="read-more-btn" onclick="toggleTestimonial(this)">Read More</button>
      </div>

      <!-- Testimonial #3 -->
      <div class="testimonial">
        <p class="testimonial-short">
          “Josh is a very patient tutor. He explains my calculus problems super well so that I really...”
        </p>
        <p class="testimonial-full">
          “Josh is a very patient tutor. He explains my calculus problems super well so that I really
          understand the concept instead of just memorizing stuff. I feel like he really gets what
          I’m saying when I ask questions and he always makes sure I understand everything before
          moving on. I always get a lot done every session with Josh and would definitely recommend him.”
        </p>
        <p>— Luca D, Student</p>
        <button class="read-more-btn" onclick="toggleTestimonial(this)">Read More</button>
      </div>

      <!-- Add more testimonials as needed, each within a .testimonial div -->
    </div>
    <!-- End .testimonials-grid -->

  </div>
  <!-- END TESTIMONIALS SECTION -->

  <script>
    /**
     * Toggles between showing the short excerpt and the full testimonial text.
     */
    function toggleTestimonial(button) {
      // The parent .testimonial container
      const testimonialContainer = button.parentElement;
      // The partial text paragraph
      const shortText = testimonialContainer.querySelector('.testimonial-short');
      // The full text paragraph
      const fullText = testimonialContainer.querySelector('.testimonial-full');

      // If the full text is hidden, show it and hide the short text
      if (fullText.style.display === 'none' || fullText.style.display === '') {
        shortText.style.display = 'none';
        fullText.style.display = 'block';
        button.textContent = 'Show Less';
      } else {
        // Otherwise, hide the full text and show only the short text
        shortText.style.display = 'block';
        fullText.style.display = 'none';
        button.textContent = 'Read More';
      }
    }
  </script>

</body>
</html>
