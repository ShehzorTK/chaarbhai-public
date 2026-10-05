/* Paper only (loaded by index.html when the URL says ?theme=paper).
   Text of the Privacy Policy, Terms of Service and Refund and Cancellation pages (#/privacy, #/terms, #/refunds).
   Drafts live in the project's compliance folder. Every figure is set; no placeholders remain. */
(function(){
const UPDATED='October 5, 2026';
const MAIL='<a href="mailto:info@chaarbhai.com">info@chaarbhai.com</a>';

const privacy=`
<section class="hero legal-hero">
  <h1 class="d1 rv" data-d="1">Privacy Policy</h1>
  <p class="lead rv" data-d="2">What we collect, why, and the choices you have. Last updated ${UPDATED}.</p>
</section>
<section class="legal" aria-labelledby="trust-h">
  <div class="trust">
    <h2 id="trust-h" class="mono">Built around the privacy laws of the places we shoot</h2>
    <ul class="chips">
      <li><a href="#/privacy" data-jump="s8-ca"><b>Canada</b> PIPEDA, CASL, Quebec Law 25</a></li>
      <li><a href="#/privacy" data-jump="s8-us"><b>United States</b> California CalOPPA, CAN-SPAM, state privacy laws</a></li>
      <li><a href="#/privacy" data-jump="s8-eu"><b>United Kingdom</b> UK GDPR, PECR</a></li>
      <li><a href="#/privacy" data-jump="s8-eu"><b>European Union</b> GDPR, ePrivacy</a></li>
      <li><a href="#/privacy" data-jump="s8-au"><b>Australia</b> Privacy Act and Australian Privacy Principles, Spam Act</a></li>
      <li><a href="#/privacy" data-jump="s8-in"><b>India</b> Digital Personal Data Protection Act</a></li>
      <li><a href="#/privacy" data-jump="s8-pk"><b>Pakistan and elsewhere</b> local law where it gives you rights</a></li>
    </ul>
    <p class="note">These are the laws this policy is written to meet. They are not certificates or seals: no government issues a compliance badge for them, and we don’t display any badge we haven’t earned.</p>
    <ul class="promises">
      <li>We never sell your information.</li>
      <li>Photos and films on this site are published only for couples who agreed to it in their contract.</li>
      <li>Analytics stays off until you say yes.</li>
    </ul>
  </div>

  <div class="prose">
    <h2>1. Who we are</h2>
    <p>Chaar Bhai Inc. (“we”, “us”) is a wedding photography and film company based in Canada that travels to weddings internationally. Questions or requests about your information go to our Privacy Officer, Chaar Bhai Inc., at ${MAIL}.</p>

    <h2>2. What we collect, and why</h2>
    <div class="tbl"><table>
      <thead><tr><th>What</th><th>Why</th><th>Our legal basis (EU/UK)</th></tr></thead>
      <tbody>
        <tr><td>Enquiry form: your names, email, phone, wedding date, location, message</td><td>To reply, quote and book your wedding</td><td>Steps before a contract; our legitimate interest in replying</td></tr>
        <tr><td>Emails, messages and booking details after you enquire</td><td>To plan and deliver your wedding</td><td>Contract</td></tr>
        <tr><td>Photos and films of weddings</td><td>To deliver them to you; and, only where you agreed, to show our work</td><td>Contract; your consent for marketing use</td></tr>
        <tr><td>Website analytics (see section 5)</td><td>To count visits and see which pages and prices people look at</td><td>Your consent</td></tr>
        <tr><td>Job applications sent to our email</td><td>To consider your application</td><td>Your request; consent</td></tr>
        <tr><td>Standard server logs kept by our hosts (IP, browser, page, time)</td><td>To keep the site secure and running</td><td>Legitimate interest</td></tr>
      </tbody>
    </table></div>
    <p>We do not use session recording, heatmaps, advertising pixels or fingerprinting. We do not run ads on this site or build profiles to sell.</p>

    <h2>3. Photos and films of you</h2>
    <ul>
      <li>The pictures and films on this site are published only for couples who agreed to it. Our client contract asks: “Are you okay with us using your photos for marketing purposes on our social media and our website?” We only upload images from couples who said yes.</li>
      <li>Guests: we take care with close-up images of guests and we ask for permission before featuring them in marketing.</li>
      <li>Children: we use images of children in marketing only with a parent’s or guardian’s permission.</li>
      <li>Changed your mind? Email ${MAIL} and we will remove your images from the site and our social pages. We aim to do it within 7 days. Images already shared by others, or in printed material already delivered, may be outside our control.</li>
      <li>Your photos remain yours to enjoy under the licence in your contract; copyright stays with Chaar Bhai Inc. as set out there.</li>
    </ul>

    <h2>4. Who we share information with</h2>
    <p>We do not sell or rent your information, and we do not “share” it for advertising. We use service providers who handle it on our behalf, under their own privacy terms:</p>
    <ul>
      <li>Google (Analytics, and YouTube for our films): analytics only after you accept; YouTube loads from its privacy-enhanced domain.</li>
      <li>Studio Ninja: our enquiry and booking system; receives what you type into the contact form.</li>
      <li>Netlify and GitHub: website hosting; keep standard server logs.</li>
      <li>wfolio (our gallery delivery platform): hosts galleries for clients.</li>
      <li>Professional advisers (lawyer, accountant), and authorities when the law requires.</li>
    </ul>

    <h2 id="s5">5. Cookies, analytics and similar technologies</h2>
    <ul>
      <li><b>Strictly necessary:</b> the site remembers your display choices (light or dark, whether you have seen the intro, your pricing choices) on your own device. These never leave your device and do not need consent.</li>
      <li><b>Analytics (Google Analytics 4):</b> off until you click Accept in the notice. If you accept, Google sets cookies (<code>_ga</code>, <code>_ga_G-X1GHG229CQ</code>, up to 14 months) and receives your approximate location, device and the pages you view. We never send your name or anything you type in a form. Decline, or change your choice any time with <button type="button" class="linkish" data-consent-open>Cookie settings</button>.</li>
      <li><b>YouTube films:</b> when a film loads, YouTube may receive your IP address and set cookies once you play it. We use YouTube’s privacy-enhanced mode.</li>
      <li><b>Signals:</b> if your browser sends Global Privacy Control or Do Not Track, we treat it as Decline for analytics.</li>
      <li>We have no advertising cookies.</li>
    </ul>

    <h2>6. Where your information is kept</h2>
    <p>Our providers store data in Canada, the United States and other countries. Those countries’ laws may differ from yours. Where European, UK or other law requires it, we rely on recognised safeguards (such as the EU-US Data Privacy Framework or standard contractual clauses).</p>

    <h2>7. How long we keep it</h2>
    <ul>
      <li>Enquiries that do not become bookings: only as long as we need them to reply and follow up.</li>
      <li>Client records, contracts and invoices: as long as tax and business record rules require.</li>
      <li>Delivered galleries: for the period in your contract.</li>
      <li>Analytics: 14 months.</li>
      <li>Job applications: only as long as we need them to consider your application.</li>
    </ul>
    <p>Then we delete or anonymise it.</p>

    <h2>8. Your rights</h2>
    <p>Depending on where you live you may have the right to: see what we hold; correct it; delete it; object to or limit how we use it; take a copy; withdraw consent at any time (this does not affect past use); and not be treated differently for using these rights. Email ${MAIL}. We aim to reply within 30 days (one month under GDPR and UK GDPR). We may ask you to confirm who you are.</p>
    <ul>
      <li id="s8-ca"><b>Canada and Quebec:</b> you may complain to the Office of the Privacy Commissioner of Canada, or in Quebec the Commission d’accès à l’information. Quebec residents can ask how decisions about them are made and request a copy in a usable format.</li>
      <li id="s8-eu"><b>EU and UK:</b> you may complain to your local data protection authority (in the UK, the ICO).</li>
      <li id="s8-us"><b>California and other US states:</b> we do not sell your personal information or share it for cross-context behavioural advertising. California and some other states give you the rights above; email us to use them. We honour Global Privacy Control signals.</li>
      <li id="s8-au"><b>Australia:</b> you may ask for access or correction and complain to us first, then to the Office of the Australian Information Commissioner.</li>
      <li id="s8-in"><b>India:</b> you may ask us to see, correct or erase your data and can use our email as your grievance contact, and you may complain to the Data Protection Board when it is operating.</li>
      <li id="s8-pk"><b>Pakistan and everywhere else:</b> we will honour any privacy rights your local law gives you.</li>
    </ul>

    <h2>9. Emails and marketing</h2>
    <p>We reply to enquiries. We send marketing email (newsletters, offers) only with your express consent, identify ourselves, and include a working unsubscribe link. We do not currently send marketing email.</p>

    <h2>10. Children</h2>
    <p>Our site is for adults planning weddings and is not directed to children. We do not knowingly collect information from children under 13 (US COPPA) or under the age of consent where you live. If you think a child has sent us information, email us and we’ll delete it.</p>

    <h2>11. Security and breaches</h2>
    <p>We use HTTPS, limit access to our team and use reputable providers. No system is perfectly secure. If a breach creates a real risk of harm, we will tell you and the regulator as the law requires, and we keep a record of every breach.</p>

    <h2>12. Reviews</h2>
    <p>Reviews on our site come from public Google reviews, shown with the reviewer’s public name. To have yours removed, email us.</p>

    <h2>13. Changes</h2>
    <p>We update this page when things change and show the date. Last updated: ${UPDATED}.</p>
  </div>
</section>`;

const terms=`
<section class="hero legal-hero">
  <h1 class="d1 rv" data-d="1">Terms of Service</h1>
  <p class="lead rv" data-d="2">Using this website and booking with Chaar Bhai Inc. Last updated ${UPDATED}.</p>
</section>
<section class="legal">
  <div class="prose">
    <p><b>In short:</b> this page covers using the website and booking with Chaar Bhai Inc. Your signed booking agreement has the full details. If the two disagree, the agreement wins.</p>

    <h2>1. Using this website</h2>
    <ul>
      <li>Everything on the site (photos, films, text, design, logo) belongs to Chaar Bhai Inc. or is used with permission. You may view and share links to it; you may not copy, scrape, resell or republish it, or use it to train AI systems, without written permission.</li>
      <li>Prices, packages and estimates on the site are guides, not offers. Your price is fixed only in your signed agreement.</li>
      <li>We try to keep the site accurate and available but do not promise it is error-free or always online.</li>
      <li>Links to other sites (Instagram, YouTube, Google reviews) are not under our control.</li>
    </ul>

    <h2>2. Enquiring and booking</h2>
    <ol>
      <li><b>Enquiry.</b> Sending the contact form does not book us. We reply with availability and a quote.</li>
      <li><b>Booking.</b> Your date is held only when you have signed the agreement and paid the retainer set out in it.</li>
      <li><b>Payments.</b> The retainer, the payment schedule and the due dates are set out in your agreement. Prices are in Canadian dollars unless your agreement says otherwise, and taxes are set out in your agreement.</li>
      <li><b>Changes.</b> Changes to date, venue, hours or package are agreed in writing; extra hours and add-ons are charged at the rates in your agreement.</li>
    </ol>

    <h2>3. What we deliver</h2>
    <ul>
      <li>Coverage hours, deliverables and delivery times are as listed in your package and agreement.</li>
      <li>We use our professional judgment on style, composition and editing. We cannot guarantee specific shots, and we are not responsible for things outside our control such as lighting, venue restrictions, weather or guests blocking views.</li>
      <li>Galleries are kept online for the period set out in your agreement; you are responsible for downloading and backing up your files. We also keep our own backup for a limited time, but we are not a storage service.</li>
      <li>Rush delivery and other options are available as add-ons.</li>
    </ul>

    <h2>4. Copyright and how you can use your files</h2>
    <ul>
      <li>Chaar Bhai Inc. keeps the copyright in all photos and films. You get a licence for personal use: printing, sharing with family and friends, and posting on social media with credit (tag @chaarbhai). Commercial use, resale, or entering contests needs written permission.</li>
      <li>You may not apply filters or edits that alter our look and then present it as our work.</li>
      <li>Music in films is licensed for the film as delivered; do not re-post films on other platforms in ways that breach those licences.</li>
    </ul>

    <h2>5. Permission to show your photos and films</h2>
    <ul>
      <li>Our booking agreement asks whether you agree to us using your photos and films for marketing on our website and social media. We only publish the work of couples who said yes, and we will remove images on request (see the <a href="#/privacy" data-nav>Privacy Policy</a>).</li>
      <li>We take care with guests and children and ask permission before featuring them in marketing.</li>
    </ul>

    <h2>6. Travel and weddings abroad</h2>
    <ul>
      <li>Travel, accommodation, visas, permits and local taxes for weddings outside our home area are quoted separately in your agreement.</li>
      <li>If travel is blocked by events outside our control (see section 8), we will work with you on options, including a replacement photographer or film team of equal standard.</li>
    </ul>

    <h2>7. If we can’t attend</h2>
    <p>In the unlikely event that we cannot cover your wedding (serious illness, emergency, accident), we will promptly tell you and arrange a replacement of comparable standard where possible. If we cannot provide one, we will refund what you have paid for services not delivered (see the <a href="#/refunds" data-nav>Refund and Cancellation Policy</a>).</p>

    <h2>8. Events outside our control</h2>
    <p>Neither of us is responsible for failing to perform because of events beyond reasonable control (natural disaster, severe weather, war, pandemic restrictions, government action, travel bans, venue closures). We will work together to reschedule or find a fair solution.</p>

    <h2>9. Our liability</h2>
    <ul>
      <li>We take care of your day and your files. To the extent the law allows, our total liability for any claim connected to our services is limited to the amount you paid us, and we are not liable for indirect losses such as emotional distress, lost opportunities or costs of a re-held event.</li>
      <li>Nothing excludes liability that cannot be excluded by law, and nothing here limits rights you have by law.</li>
    </ul>

    <h2>10. Your responsibilities</h2>
    <ul>
      <li>Give us accurate information, a list of key moments, and access to the venue. Tell us about any restrictions (for example places where photography isn’t allowed).</li>
      <li>Make sure guests and officiants respect our working space.</li>
    </ul>

    <h2>11. Privacy</h2>
    <p>How we handle your information is set out in our <a href="#/privacy" data-nav>Privacy Policy</a>.</p>

    <h2>12. Disputes</h2>
    <p>We hope to sort any concern through a conversation first. Email ${MAIL}. If you are a consumer in a place that gives you mandatory rights (for example the UK, EU, Australia or Quebec), those rights stay in place.</p>

    <h2>13. Changes to these terms</h2>
    <p>We may update this page; the date at the top shows the latest version. Terms in your signed agreement do not change unless both of us sign.</p>
    <p>Contact: ${MAIL}</p>
  </div>
</section>`;

const refunds=`
<section class="hero legal-hero">
  <h1 class="d1 rv" data-d="1">Refunds and<br>Cancellation</h1>
  <p class="lead rv" data-d="2">What happens to your payments if plans change. Last updated ${UPDATED}.</p>
</section>
<section class="legal">
  <div class="prose">
    <p><b>In short:</b> all payments to Chaar Bhai Inc. are non-refundable if you cancel. In return, we reserve your date and turn away every other booking for it.</p>

    <h2>1. Why payments are non-refundable</h2>
    <p>Wedding dates are limited and cannot be resold at short notice. When we receive your deposit, we commit to attending your event on the date you chose, and we make no other reservations for that date. Because that date is held for you and no one else, payments you have made are not refunded.</p>

    <h2>2. If you cancel</h2>
    <p>If you cancel the event entirely, Chaar Bhai Inc. is not required to repay any of the payments you have made. Please tell us in writing at ${MAIL} so we can release the date.</p>

    <h2>3. If you need to change the date</h2>
    <p>A change of date is not a cancellation. Ask us as early as you can. If we are free on the new date, we can move your booking and your payments carry over one time at no charge. If we are not available, the cancellation terms above apply.</p>

    <h2>4. If we cannot attend or deliver</h2>
    <p>This is the one situation where we do refund. If Chaar Bhai Inc. cancels, cannot attend your event, or cannot deliver the services you paid for, we will tell you promptly, try to arrange a replacement of comparable standard, and, if you do not want that or none is available, refund what you have paid for services not delivered within 14 days.</p>

    <h2>5. Events outside anyone’s control</h2>
    <p>If an event beyond reasonable control (severe weather, government travel bans, pandemic restrictions, venue closure) stops the wedding from going ahead as planned, we will work with you on a new date.</p>

    <h2>6. Your legal rights</h2>
    <p>Nothing in this policy takes away rights you have under the law where you live (for example mandatory consumer rights in the UK, EU, Australia, Quebec or elsewhere), including any right to a remedy if we do not provide a service as agreed.</p>

    <h2>7. Questions</h2>
    <p>Contact us at ${MAIL}. See also our <a href="#/terms" data-nav>Terms of Service</a>.</p>
  </div>
</section>`;

window.CB_LEGAL={'/privacy':{html:privacy,title:'Privacy Policy · Chaar Bhai'},'/terms':{html:terms,title:'Terms of Service · Chaar Bhai'},'/refunds':{html:refunds,title:'Refunds and Cancellation · Chaar Bhai'}};
})();
/* the trust chips jump to their section on the same page without touching the route */
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[data-jump]');if(!a)return;
  var t=document.getElementById(a.getAttribute('data-jump'));if(!t)return;
  e.preventDefault();
  t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
