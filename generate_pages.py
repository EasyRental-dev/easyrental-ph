import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract parts
# We want to capture from <!DOCTYPE up to </nav>
head_match = re.search(
    r'(<!DOCTYPE html>.*?<title>).*?(</title>.*?</head>\s*<body>.*?<nav\b[^>]*>.*?</nav>)',
    content,
    re.DOTALL,
)
footer_match = re.search(r'(<!-- ═══ FOOTER ════════════════════════════════════════════════════════ -->.*</html>)', content, re.DOTALL)

if not head_match or not footer_match:
    print("Could not parse index.html template.")
    # Debug: see what failed
    if not head_match: print("Head match failed")
    if not footer_match: print("Footer match failed")
    exit(1)

head_part1 = head_match.group(1)
head_part2 = head_match.group(2)
footer = footer_match.group(1)

nav_fixed = head_part2

def build_page(filename, title, description, h1, keyword, img_src, img_alt, content_html):
    # Fix description
    page_head2 = nav_fixed
    # simple hack to replace description
    page_head2 = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{description}">', page_head2)
    
    html = f'''{head_part1}{title}{page_head2}

<section style="padding:140px 24px 80px;background:var(--surface);">
  <div style="max-width:1000px;margin:0 auto;text-align:center;">
    <h1 class="display" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;letter-spacing:-.03em;margin-bottom:20px;color:var(--ink);">{h1}</h1>
    <p style="font-size:1.1rem;color:var(--muted);max-width:700px;margin:0 auto 40px;">{description}</p>
    
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:24px;overflow:hidden;box-shadow:0 20px 48px -8px rgba(16,185,129,.13);text-align:left;">
      <div style="height:350px;background:#F8FAFC;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="{img_src}" alt="{img_alt}" style="width:100%;height:100%;object-fit:contain;padding:20px;background:#fff;">
      </div>
      <div style="padding:40px;">
        {content_html}
        <div style="margin-top:30px;">
          <a href="https://m.me/EasyRental.ngani" target="_blank" class="pill pill-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.452 5.506 3.732 7.205V22l3.405-1.869C10.012 20.371 10.992 20.5 12 20.5c5.523 0 10-4.145 10-9.257S17.523 2 12 2zm1.09 12.467-2.545-2.72-4.97 2.72 5.464-5.8 2.609 2.72 4.906-2.72-5.464 5.8z"/></svg>
            Inquire Now on Messenger
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

{footer}'''
    
    # We must also inject the description before the title in head_part1. Wait, head_part1 has the description. Let's fix that.
    html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{description}">', html)
    page_canonical = f'https://easyrental-dev.github.io/easyrental-ph/{filename}'
    html = re.sub(
        r'<link rel="canonical" href="[^"]*"\s*>',
        f'<link rel="canonical" href="{page_canonical}">',
        html,
        count=1,
    )

    with open(filename, 'w', encoding='utf-8') as out:
        out.write(html)
    print(f"Generated {filename}")

# Page 1
build_page(
    'tent-rental-lipa-batangas.html',
    'Tent Rental Lipa Batangas | Black & Beige 3×4.5m Canopies | Easy Rental',
    'Tent rental in Lipa Batangas: 3x4.5m retractable tents with black or beige/khaki canopy. Weddings, parties & events—delivery & setup. Message Easy Rental for availability.',
    'Tent Rental in Lipa Batangas',
    'Tent Rental Lipa Batangas',
    'assets/easyrental_tent.jpg',
    '3x4.5m Retractable Tent Rental in Lipa Batangas',
    '''<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:16px;">Premium 3×4.5m Retractable Tents</h2>
    <p style="color:var(--muted);margin-bottom:16px;line-height:1.6;">Our heavy-duty retractable tents are perfect for outdoor gatherings in Lipa and Batangas. Canopy colors: <strong>black</strong> or <strong>beige/khaki</strong>—mention your preference when you book (subject to availability).</p>
    <ul style="color:var(--muted);margin-bottom:16px;line-height:1.6;padding-left:20px;list-style-type:disc;">
      <li>Size: 3 meters by 4.5 meters (spacious enough for multiple tables)</li>
      <li>Canopy: <strong>Black</strong> or <strong>beige/khaki</strong></li>
      <li>Quick professional setup and takedown by our team</li>
      <li>Sturdy frame, perfect for Batangas weather</li>
    </ul>'''
)

# Page 2 — bespoke manual file (matches table-rental-lipa-batangas.html layout; do not regenerate)
"""
build_page(
    'tables-chairs-rental-batangas.html',
    ...
)
"""

# Page 3 - DEPRECATED in script, moved to bespoke manual file for :target support
"""
build_page(
    'wedding-event-package-lipa.html',
    'Event Package Rental Lipa Batangas | Wedding & Party Setups',
    'Complete event package rentals in Lipa Batangas for 20 to 50 pax. Includes tents, tables, and chairs. Perfect for weddings, birthdays, and parties.',
    'Complete Event Packages in Lipa',
    'Event Package Rental Lipa Batangas',
    'assets/easyrental_tent.jpg',
    'Event Package Rental Setup in Lipa Batangas',
    '''<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:16px;">Hassle-Free Event Packages</h2>
    <p style="color:var(--muted);margin-bottom:16px;line-height:1.6;">Save time and money with our bundled event packages! We offer heavily discounted sets that include everything you need for a comfortable outdoor or indoor celebration in Batangas.</p>
    <div style="display:grid;gap:16px;margin-top:24px;">
      <div style="padding:16px;border:1px solid #E2E8F0;border-radius:12px;"><strong>Set A (20 Pax) - ₱1,479:</strong> 20 Chairs, 3 Tables, 1 Tent</div>
      <div style="padding:16px;border:1px solid #E2E8F0;border-radius:12px;"><strong>Set B (30 Pax) - ₱1,999:</strong> 30 Chairs, 5 Tables, 1 Tent</div>
      <div style="padding:16px;border:1px solid #E2E8F0;border-radius:12px;background:var(--brand-light);border-color:var(--brand);"><strong>Set C (50 Pax) - ₱2,879 (Best Value):</strong> 50 Chairs, 8 Tables, 1 Tent</div>
    </div>'''
)
"""


# Page 4 (Contact)
build_page(
    'contact.html',
    'Contact Us | Easy Rental Lipa Batangas',
    'Contact Easy Rental for event equipment in Lipa Batangas. Message us for tables, chairs, and tent rentals. Call 0948 512 1132.',
    'Contact Easy Rental',
    'Contact Easy Rental Lipa Batangas',
    'assets/easyrental_logo.png',
    'Easy Rental Contact',
    '''<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:16px;">Get in Touch for Bookings & Inquiries</h2>
    <p style="color:var(--muted);margin-bottom:16px;line-height:1.6;">We are available 7 days a week to serve your event needs anywhere in Lipa City and Batangas Province. Contact us today for a free quote!</p>
    <ul style="color:var(--muted);margin-bottom:16px;line-height:1.6;padding-left:20px;list-style-type:none;margin-left:-20px;">
      <li style="margin-bottom:12px;">📞 <strong>Phone:</strong> 0948 512 1132</li>
      <li style="margin-bottom:12px;">💬 <strong>Facebook Messenger:</strong> @EasyRental.ngani</li>
      <li style="margin-bottom:12px;">📍 <strong>Location:</strong> Lipa City, Batangas</li>
    </ul>
    <p style="color:var(--muted);margin-top:24px;font-size:.9rem;"><em>Please include your event date, location, and equipment needed so we can provide an accurate quote right away!</em></p>'''
)

