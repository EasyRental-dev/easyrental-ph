# -*- coding: utf-8 -*-
"""Update img alt text to match current assets (filenames unchanged)."""
from pathlib import Path

REPLACEMENTS = [
    # Logo
    (
        'alt="Easy Rental Lipa Batangas — logo for tables, chairs, tent, and videoke event rentals"',
        'alt="Easy Rental Lipa Batangas logo — circular ER monogram with gold rings for tables, chairs, and tent rentals"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — tables, chairs, tent, and videoke rentals"',
        'alt="Easy Rental Lipa Batangas logo — circular ER monogram for tables, chairs, tent, and videoke rentals"',
    ),
    (
        'alt="Easy Rental Lipa Batangas Logo"',
        'alt="Easy Rental Lipa Batangas logo — circular ER monogram with gold rings"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — contact for tent, table, chair rental"',
        'alt="Easy Rental Lipa Batangas logo — contact for tent, table, and chair rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — message for tables, chairs, tent, videoke quotes"',
        'alt="Easy Rental Lipa Batangas logo — message for tables, chairs, tent, and videoke quotes"',
    ),
    (
        'alt="Easy Rental Lipa Batangas event rentals"',
        'alt="Easy Rental Lipa Batangas logo — event equipment rentals"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — event tables, chairs, and tent rentals"',
        'alt="Easy Rental Lipa Batangas logo — tables, chairs, and tent rentals"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — tent, tables, and chairs rental"',
        'alt="Easy Rental Lipa Batangas logo — tent, tables, and chairs rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — monobloc chairs and table rental"',
        'alt="Easy Rental Lipa Batangas logo — monobloc chairs and table rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — Set A event package rental"',
        'alt="Easy Rental Lipa Batangas logo — Set A event package rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — Set B event package rental"',
        'alt="Easy Rental Lipa Batangas logo — Set B event package rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — Set C event package rental"',
        'alt="Easy Rental Lipa Batangas logo — Set C event package rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — event package tent, tables, chairs"',
        'alt="Easy Rental Lipa Batangas logo — event package tent, tables, and chairs"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — affordable event packages"',
        'alt="Easy Rental Lipa Batangas logo — affordable event packages"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — affordable wedding and party packages"',
        'alt="Easy Rental Lipa Batangas logo — affordable wedding and party packages"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — tables, chairs, tent packages"',
        'alt="Easy Rental Lipa Batangas logo — tables, chairs, and tent packages"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — large party rental packages"',
        'alt="Easy Rental Lipa Batangas logo — large party rental packages"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — event furniture rental"',
        'alt="Easy Rental Lipa Batangas logo — event furniture rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — event tent rental"',
        'alt="Easy Rental Lipa Batangas logo — event tent rental"',
    ),
    (
        'alt="Easy Rental Lipa — videoke, tent, tables, chairs rental"',
        'alt="Easy Rental Lipa Batangas logo — videoke, tent, tables, and chairs rental"',
    ),
    (
        'alt="Easy Rental Lipa Batangas — tables, chairs, tent rentals"',
        'alt="Easy Rental Lipa Batangas logo — tables, chairs, and tent rentals"',
    ),
    # Showcase products
    (
        'alt="3x4.5m Retractable Tent Rental Lipa Batangas - Beige Khaki Canopy for Events"',
        'alt="Cream beige pop-up canopy tent rental Lipa Batangas — silver metal frame for outdoor events"',
    ),
    (
        'alt="3x4.5m Retractable Tent Rental Lipa Batangas - Black Canopy for Outdoor Events"',
        'alt="Black pop-up canopy tent rental Lipa Batangas — silver metal frame for outdoor events"',
    ),
    (
        'alt="Cofta Marble White Monobloc Chair Rental Lipa Batangas - Plastic Stackable Chairs"',
        'alt="White plastic monobloc chair rental Lipa Batangas — stackable event seating"',
    ),
    (
        'alt="6ft Rectangular Foldable Table Rental Lipa Batangas - Event Tables for Weddings"',
        'alt="White rectangular folding table rental Lipa Batangas — 6ft event table with black metal legs"',
    ),
    (
        'alt="Portable Videoke Karaoke Machine Rental Lipa Batangas with Wireless Microphones"',
        'alt="Portable videoke karaoke machine rental Lipa Batangas — built-in screen, blue-lit song keypad, and speakers"',
    ),
    (
        'alt="Portable Videoke Karaoke Machine Rental Lipa Batangas with Wireless Microphones — promo"',
        'alt="Easy Rental videoke rental promo poster — features, pricing, and booking details Lipa Batangas"',
    ),
    (
        'alt="Videoke karaoke rental equipment side by side — Lipa City and Batangas events"',
        'alt="Two Easy Rental portable videoke units side by side — red butterfly design with blue-lit controls"',
    ),
    # Proof gallery (index.html)
    # Proof gallery JPGs (git-modified assets)
    (
        'alt="Easy Rental outdoor setup — beige and black pop-up tents with white monobloc chairs and draped table on grassy field"',
        'alt="Easy Rental outdoor event setup — tan and black pop-up canopies with rows of white monobloc chairs and a white-covered table on open grassy field"',
    ),
    (
        'alt="Easy Rental delivery — blue truck loaded with stacked white chairs, folded tables, and tent frame poles"',
        'alt="Easy Rental delivery — blue pickup truck bed loaded with stacked white monobloc chairs and folded white tables tied with rope, plus tent frame poles"',
    ),
    (
        'alt="Easy Rental on-site setup — cream pop-up tent with white chair covers and draped tables in a home courtyard"',
        'alt="Easy Rental event setup — yellow-beige pop-up canopy with white chair slipcovers and draped tables on a tiled home courtyard"',
    ),
    (
        'alt="Easy Rental inventory — stacks of white monobloc chairs and folded tables staged for upcoming bookings"',
        'alt="Easy Rental inventory — four stacks of white monobloc chairs and folded white plastic tables staged against a navy wall before dispatch"',
    ),
    (
        'alt="Google review screenshot praising Easy Rental for a smooth, stress-free inquiry to delivery process and clean chairs and tables"',
        'alt="Google review screenshots — 5-star Easy Rental reviews for short-notice booking, clean chairs and tables, and smooth delivery"',
    ),
    (
        'alt="Google review screenshot describing Easy Rental as punctual, professional, and well-maintained in tables and chairs rental service"',
        'alt="Google review screenshots — 5-star Easy Rental reviews highlighting punctual delivery and well-maintained tables and chairs"',
    ),
    (
        'alt="Map screenshot showing Easy Rental location in Lipa City, Batangas. Click to open Google Maps."',
        'alt="Google Maps screenshot — Easy Rental Tables, Chairs and Tent Rentals location pin in Lipa City, Batangas"',
    ),
    # Package / unit card context-specific
    (
        'alt="Tent included in Easy Rental event packages for Lipa Batangas"',
        'alt="Cream pop-up canopy tent included in Easy Rental event packages — Lipa Batangas"',
    ),
    (
        'alt="Tent included in Easy Rental Set A package for Lipa Batangas"',
        'alt="Cream pop-up tent in Easy Rental Set A package — 20 pax tables, chairs, and canopy Lipa Batangas"',
    ),
    (
        'alt="6ft tables included in Easy Rental Set B package for Lipa Batangas"',
        'alt="White folding tables in Easy Rental Set B package — 30 pax tables, chairs, and tent Lipa Batangas"',
    ),
    (
        'alt="3x4.5m Retractable Tent Rental Lipa Batangas - Beige Khaki Canopy — Set C 50 pax package"',
        'alt="Cream pop-up canopy in Easy Rental Set C package — 50 pax tables, chairs, and tent Lipa Batangas"',
    ),
    # Meta og/twitter image alt
    (
        'content="3x4.5m Retractable Tent Rental Lipa Batangas - Beige Khaki Canopy for Outdoor Events"',
        'content="Cream beige pop-up canopy tent rental Lipa Batangas — Easy Rental event equipment"',
    ),
    (
        'content="3x4.5m Retractable Tent Rental Lipa Batangas - Beige Khaki Canopy for Events"',
        'content="Cream beige pop-up canopy tent rental Lipa Batangas — Easy Rental outdoor events"',
    ),
    (
        'content="Event package rental Lipa Batangas — tent, monobloc chairs, and 6ft tables bundle"',
        'content="Easy Rental event packages Lipa Batangas — pop-up tent, monobloc chairs, and folding tables"',
    ),
    (
        'content="Wedding and party package rental Lipa Batangas — tables, chairs, tent"',
        'content="Easy Rental wedding and party packages — tables, chairs, and pop-up tent Lipa Batangas"',
    ),
]

root = Path(__file__).parent
count = 0
for path in root.glob("*.html"):
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding="utf-8")
        count += 1
        print("updated", path.name)

print("done,", count, "files")
