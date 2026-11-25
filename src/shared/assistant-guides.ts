import type { PageCategory } from "./assistant";

// Page-aware help for "Ask ImprintSites AI" (owner, 25 Nov 2026): every part of the platform gets its own starter
// questions, and the assistant gets a matching guide of verified, page-specific facts so its detailed, step-by-step
// answers name the real buttons and screens. Keep both in step with the UI labels when screens change.

export interface PageGuide {
  /** Starter questions shown in the chat panel on this page. */
  starters: string[];
  /** Verified facts about this page, appended to the system message. */
  guide: string;
}

export const PAGE_GUIDES: Record<PageCategory, PageGuide> = {
  home: {
    starters: [
      "Should I start from a template or share the link of a website I love? Explain both ways to start and how to combine them.",
      "I run a small business. Should I choose a business site or an online store, and what is the difference in features and price?",
      "Walk me through every step from describing my website to having it live at my own web address.",
      "What exactly do I get for the one-time build fee, and what does the monthly hosting and maintenance cover?",
      "Can I build and preview my whole site for free before I pay anything? What happens when I'm ready to publish?",
    ],
    guide: `Home page: shows the three kinds of site with their build prices, the template gallery (business first), how it works, pricing and FAQs. Typing a description of the site in the box at the top and pressing "Start building" leads to a free sign-up, then the setup wizard. "+ Add a website you love" lets a visitor give an example site for style inspiration.`,
  },
  pricing: {
    starters: [
      "Compare the personal, business and online store plans: what each can do, what each costs once, and the monthly hosting for each.",
      "When exactly do I pay, and can I keep editing and republishing my site after I've paid at no extra cost?",
      "Is the monthly hosting being charged right now? How will I be told before it starts, and can I cancel it?",
      "What is your refund policy for the build fee, before and after my site is published?",
    ],
    guide: `Pricing page: one-time build fee per site, paid only when publishing; building, editing and previewing are free. The fee covers publishing that site plus unlimited edits and republishing. Refunds (from the Refund policy): before publishing nothing has been paid; once a paid site is published the fee is generally non-refundable, but requests within 14 days are considered where the site did not work as described; if a refund is given the site is taken offline and the draft stays in the account. Monthly hosting can be cancelled at any time; paid months are not refunded except where the service failed. Purchases from customers' online stores follow that seller's own returns policy.`,
  },
  templates: {
    starters: [
      "How do I find the right template for my business? Explain the filters for site type, shop category and style, and the 'See more' button.",
      "I found a template I like. How do I start my site with it, and can I also match the colours of a website I love?",
      "What is the difference between Signature, Premium and the other templates, and why are some marked 'Member'?",
      "If I start with one template and switch to another later, will I lose my text, photos or products?",
      "How do I open a template in full to see all its pages, including the shop, product and about pages?",
    ],
    guide: `Template gallery: filters by site type (Business, Personal, Online store), shop category and style; 12 templates show at first and "See more templates" loads more, with a running count. Signature templates come first, then Premium, then the rest. Cards marked "Member" need a free account to open in full; signed-out visitors see only a small preview picture. Every template is a complete multi-page site with sample content that is replaced by the customer's own. In the editor, "Change template" switches design and keeps the customer's content.`,
  },
  "how-it-works": {
    starters: [
      "Explain each step of building a site here, from the setup questions to publishing, and roughly how long each takes.",
      "What does 'Paste a website you love' do, and what does it take from that website (and what does it never copy)?",
      "How does 'Polish my wording with AI' work, and do I have to accept its suggestions?",
      "After I publish, how do I make changes, and how do they go live?",
    ],
    guide: `How it works: 1) sign up free; 2) answer the setup wizard (details, style, and for stores products, delivery and payment methods); 3) choose a template ("Choose a template", with "Recommended" matches) or "Paste a website you love" so the style is read for colours, fonts and layout only, never its text, images, logos or code; 4) "Generate my website"; 5) edit in the editor; 6) preview on Desktop, Tablet and Mobile; 7) pay once and publish to a web address; edits are republished from the Publish page. "Polish my wording with AI" suggests clearer copy; suggestions are marked for review and nothing is invented about the business.`,
  },
  contact: {
    starters: [
      "What details should I include in my message so support can solve my problem quickly?",
      "I have a problem with a payment or publishing. What information do you need from me?",
      "How do I ask for my data to be exported or my account to be deleted?",
    ],
    guide: `Contact page: a support form with a topic, the person's name, email, subject and message; it creates a support ticket for the team. Helpful details: the site's web address or name, what was clicked, what happened, any error message, and for payments the date and amount (never card numbers). Data export is self-service from Account ("Download my data"); deletion is requested from Account ("Request account deletion") or through this form.`,
  },
  legal: {
    starters: [
      "In plain words, what does the refund policy say about the build fee and the monthly hosting?",
      "What personal data do you keep about me and the visitors to my site, and which companies process it?",
      "How can I download my data or have my account deleted, and what is kept afterwards?",
    ],
    guide: `Legal pages: Terms, Privacy and Refunds. Privacy: the platform stores account details, website content, payment records (card details stay with the payment provider), support messages and a salted hash of IP addresses; visitor form and checkout details are stored for the site owner. Providers: Cloudflare (hosting, database, storage, AI inference), the payment provider, Google (only for Google sign-in) and Google Fonts, an email provider if enabled, and DeepSeek only for questions sent to this help assistant. Deletion requests are completed within 30 days, except records kept for legal, tax, fraud or dispute reasons. Refund rules are as on the pricing page.`,
  },
  auth: {
    starters: [
      "Do I need to pay to create an account, and what exactly does a free account let me do?",
      "I forgot my password. How do I reset it, and what if the email doesn't arrive?",
      "Which sign-in options are available, and is my account information kept secure?",
    ],
    guide: `Sign-in pages: accounts are free and unlock building, previewing and member templates. Sign up needs a name, email, password and agreement to the Terms. "Forgot password" sends a reset link when email delivery is configured; otherwise people should use the Contact page.`,
  },
  dashboard: {
    starters: [
      "What are the two ways to start a new website here: choosing a template or sharing a website I love? Walk me through each.",
      "How do I start a new website from here, and which site type should I choose for what I sell or do?",
      "What does each button on my site card do: Edit design, Publish, Store, Leads, Duplicate and Archive?",
      "How can I copy my site to try a different design without risking the original?",
      "Where do I see messages and quote requests from my visitors, and orders from my store?",
    ],
    guide: `Dashboard ("Your websites"): a "Start a new website" panel offers the two recommended ways to start: "Choose a template" (opens the Templates gallery, where "Use template" starts a site with that design) and "Share a website you love" (opens the new-site form with the link box ready). "+ New website" opens the same form: choose the website type, then under "How would you like to start?" use "Browse templates" to pick a template and/or paste the link of a website you love, then the name and web address, then "Continue" to the setup wizard. Each site card shows its status and a preview, with "Edit design" (editor), "Continue setup" if unfinished, "Publish", "Store" (online stores), "Leads" (contact and quote messages), "Duplicate" (a full copy with a new address, the original untouched) and "Archive". Published sites show "Live at" with the address.`,
  },
  setup: {
    starters: [
      "In the 'Design & inspiration' step, should I choose a template or paste a website I love, and can I use both?",
      "What should I prepare before I fill in this setup, and which answers matter most for how my site looks?",
      "How does 'Paste a website you love' work, and what can I do if that website can't be read?",
      "Should I tick 'Polish my wording with AI'? What will it change and what stays exactly as I wrote it?",
      "For my online store, which payment methods and delivery options should I offer, and what instructions should customers see?",
    ],
    guide: `Setup wizard: if a template or a website-you-love link was given when the site was created, they are already applied (the link is analysed automatically in "Design & inspiration"). Steps collect details (name, what you do, location, contact details, socials, optional WhatsApp button and logo), then style. "Paste a website you love" reads only the style (colours, fonts, layout); "Upload a screenshot instead" works when a site cannot be read; "Use this style for my site" applies it; "Templates that match this style" are suggested. Store owners set "Payment methods your customers can choose" (cash on delivery, pay on pickup, bank transfer, mobile money, WhatsApp), each with a "Name shown to customers" and "Instructions shown to the customer", delivery (delivery to an address, pickup, digital delivery) and a "Low-stock warning threshold". "Generate my website" builds the draft, then "Open editor".`,
  },
  editor: {
    starters: [
      "How do I add, move, duplicate, hide or delete a section, and how do I add a new page to my site?",
      "How do I change my colours, fonts and light or dark mode in the Theme panel without breaking the layout?",
      "What does 'Refine the design' do? Give me examples of requests I can type and what they change.",
      "If I make a mistake, how do Undo, Save checkpoint and History help me get my earlier version back?",
      "Can I switch to a different template now without losing my text, photos and products?",
    ],
    guide: `Editor: the left panel "Pages and sections" lists pages ("Add page", "Delete page", page title) and their sections ("Add a section", "Move up", "Move down", "Duplicate section", "Delete section", and "Hide section" / "Show section"). Clicking a section opens the "Inspector" to edit its text, images and links. "Theme" sets colours, fonts and "Colour mode" (light or dark). "Site settings" holds the business details, and for stores "Products", "Delivery", "Payments" and "Policies". "Refine the design" takes a plain request such as "make the headings bigger" or "use a warmer colour" and applies a design change. "Undo" (Ctrl+Z) and "Redo" (Ctrl+Shift+Z) step through changes; "Save checkpoint" stores the current version straight away (no name needed; it is listed as "Manual checkpoint" with the time), and checkpoints are also made automatically when the site is generated, when AI suggestions or "Refine the design" are applied, when the template changes and before a restore. Edits save automatically. "History" lists checkpoints with "Restore". "Change template" switches design and keeps the content. "Device preview" switches between Desktop, Tablet and Mobile; "Full screen" previews the whole site. Sections marked as AI suggestions need "Mark as reviewed" before publishing.`,
  },
  publish: {
    starters: [
      "How do I choose my web address, and what happens if the name I want is already taken?",
      "Walk me through paying and publishing for the first time, and then publishing changes later.",
      "How do I go back to an earlier published version, or take my site offline for a while?",
      "How do I share a private preview link with someone before my site is public?",
    ],
    guide: `Publish page: "Your web address" checks availability live and suggests an alternative such as name-2 when taken; secure https is set up automatically. The one-time fee is paid here, then "Publish" makes the site live; later edits are published again from the same page. "Published versions" lists earlier versions with "Restore"; "Unpublish" takes the site offline while keeping the draft. "Create preview link" / "Share a private preview" makes a private link. "Export" downloads a copy of the site. "Custom domain": connecting a domain you own is not available yet; "Register interest" records it.`,
  },
  store: {
    starters: [
      "Walk me through adding a product with sizes and colours, a price for each option and stock for each one.",
      "How do I import many products at once with a CSV file, and which columns does the file need?",
      "How do orders work: where do I see them, how do I change their status and mark payment received?",
      "What do 'Track inventory', 'Allow backorder' and 'Max per order' mean, and when should I use them?",
    ],
    guide: `Store manager: "Add product" with "Product name", description, price, type ("Physical" or "Digital"), photos, categories and "Sizes, colours and stock" (option names and values, each with its own stock and optionally a "Different price"). "Track inventory" counts stock down as orders arrive; "Allow backorder" keeps taking orders at 0; "Max per order" caps quantity. "Categories" → "Add category". "Import CSV" uploads many products ("Download example CSV" gives the exact format, with columns name, price, sku, description, stock, category, tags and option name/value); "Export CSV" downloads orders. Orders: filter by status, open an order to change its status with a "Status note", and "Mark payment received" for offline payments; cancelling restocks items. Stock shows "In stock" / "Low stock" and "Count stock" corrects counts.`,
  },
  leads: {
    starters: [
      "Where do these enquiries come from, and how do I reply to someone who filled in my contact or quote form?",
      "How do I mark messages as read or archive them to keep track of quote requests?",
      "What can I change on my site to get more people to contact me?",
    ],
    guide: `Leads page: messages from the site's contact and quote forms, newest first, with the sender's details and message. "Mark read" and "Archive" keep the list tidy. Replies are sent from the owner's own email using the sender's address. Clear contact sections, a visible call to action and the optional WhatsApp button make it easier for visitors to get in touch.`,
  },
  account: {
    starters: [
      "How do I change my name or password, and what if I signed up with Google?",
      "How do I download all my data, and what does the download include?",
      "What happens if I request account deletion: what is removed, what is kept, and how long does it take?",
      "Where can I see what I've paid for each of my sites?",
    ],
    guide: `Account page: "Profile" (name), "Update password" (current and new password), "Payment history", "Download my data" (a file with the account, sites, payments and support messages) and "Request account deletion" (completed within 30 days; legal, tax, fraud and dispute records are kept).`,
  },
  admin: {
    starters: [
      "How do I change hosting prices or pause the help assistant in Settings?",
      "How do I give a site demo publishing access, and where is that recorded?",
      "Where do I find support tickets, payments, webhook events and recent errors?",
    ],
    guide: `Admin area: overview, users ("Reset link", "Suspend", "Reinstate"), projects ("Grant demo" / "Revoke demo", recorded in the audit log), "Support tickets", "Payments", "Checkout sessions", "Webhook events", "Recent errors" and Settings ("Save settings"): hosting amounts, currency, interval and status, operator name and support email, AI limits and the assistant's daily token budget (0 pauses it).`,
  },
  other: {
    starters: [
      "What can I build with ImprintSites, and which kind of site fits what I do?",
      "Walk me through building and publishing a site, step by step.",
      "What does it cost, both once and every month?",
    ],
    guide: "",
  },
};
