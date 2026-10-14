<?php
/**
 * Seed data extracted from PocketBase SQLite (pb_data/data.db)
 */

function getPocketBaseSeedData() {
    return array (
  'users' => 
  array (
    0 => 
    array (
      'id' => '0wko8ajbcdqlmlx',
      'name' => '',
      'email' => 'andy@andrewwestley.co.uk',
      'password_hash' => '$2a$10$g7R/8417lw9OsrCd0GHs8uINlkcr9I.wpemrX6TEsdFFeAO1ZfVpm',
    ),
  ),
  'journeys' => 
  array (
    0 => 
    array (
      'id' => '4fza7hxh1qutkyl',
      'title' => 'Buy a car',
      'description' => 'Initial draft map.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"","icon":"book","iconColor":"#eef2ff","id":"n1772036317369","isMomentOfTruth":false,"purpose":"","score":null,"sentiment":"","severity":"low","stageId":"s2","swimlaneId":"sl1","tags":[],"title":"Read reviews"}],"persona":"Car buyer","pointOfView":"Looking to buy a car","stages":[{"id":"s2","name":"Awareness"},{"id":"s5","name":"Purchase"},{"id":"s4","name":"Discovery"},{"id":"s4","name":"Do something"},{"id":"s5","name":"Dome something else"}],"swimlanes":[{"id":"sl1","name":"User actions"},{"id":"sl2","name":"Pain points"},{"id":"sl3","name":"Tools"},{"id":"sl4","name":"New Swimlane"},{"id":"sl5","name":"New Swimlane"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'active',
      'created_at' => '2026-02-25 08:02:14.190Z',
      'updated_at' => '2026-02-25 23:47:24.117Z',
    ),
    1 => 
    array (
      'id' => 'qqovapije9rxhbt',
      'title' => 'Event booking',
      'description' => 'Imported via .ojf file',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Alex enters professional details and selects ticket type.","id":"n-d937e4dd-8892-4865-aafc-441e75d68040","score":8,"stageId":"s1","swimlaneId":"sl1","tags":["Form","Web"],"title":"Fill out registration form"},{"description":"The early bird discount code kept failing at first.","icon":"error_outline","iconColor":"#f59e0b","id":"n-3ef40caa-37ed-453d-9d71-951c5953bafd","purpose":"pain-point","score":3,"sentiment":"frustrated","severity":"medium","stageId":"s1","swimlaneId":"sl3","title":"Coupon Code Error"},{"description":"The main portal for all registration activities.","id":"n-7869c135-b7c6-4b65-89fb-9b592bd1da78","stageId":"s1","swimlaneId":"sl4","tags":["Desktop"],"title":"Conference Website"},{"description":"Using the \'official\' conference hotel link.","id":"n-bec8d642-c82f-4e52-85cc-a522e269aa1e","isMomentOfTruth":false,"score":7,"stageId":"s2","swimlaneId":"sl1","title":"Book Flight \\u0026 Hotel"},{"description":"Worried about getting approval for the travel expenses.","icon":"trending_down","iconColor":"#f59e0b","id":"n-f09c87ca-0364-40e8-9aa3-b30bd11f2d81","purpose":"personal-hurdle","score":5,"sentiment":"anxious","stageId":"s2","swimlaneId":"sl2","title":"Stress over budget"},{"description":"Alex installs the official app to build their schedule.","icon":"smartphone","iconColor":"#4f46e5","id":"n-a2b6ad9b-7268-47dd-b2ba-5af8df0b5e4b","isMomentOfTruth":true,"purpose":"touchpoint","score":9,"sentiment":"satisfied","stageId":"s3","swimlaneId":"sl1","tags":["Mobile","App"],"title":"Download Event App"},{"description":"Scanning the QR code at the registration desk.","icon":"verified","iconColor":"#10b981","id":"n-c1dd3e10-0c04-4c4c-bf71-575151fbd6a8","purpose":"milestone","score":10,"sentiment":"relieved","stageId":"s4","swimlaneId":"sl1","tags":["In-Person"],"title":"Check-in \\u0026 Badge Pickup"},{"description":"Wait time for badge pickup was over 45 minutes.","icon":"timer","iconColor":"#ef4444","id":"n-98cd2ef0-6cc3-44be-8120-3da98bc96702","purpose":"bottleneck","score":2,"sentiment":"bored","severity":"high","stageId":"s4","swimlaneId":"sl3","title":"Long Queues"}],"persona":"Alex, Tech Lead","pointOfView":"Registering for an international developer conference","stages":[{"id":"s1","name":"Registration"},{"id":"s2","name":"Travel Logistics"},{"id":"s3","name":"Pre-Event"},{"id":"s4","name":"Day 1 Arrival"}],"swimlanes":[{"id":"sl1","name":"Interaction"},{"id":"sl2","name":"User Health (Sentiment)"},{"id":"sl3","name":"Issues \\u0026 Roadblocks"},{"id":"sl4","name":"Tools Used"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'active',
      'created_at' => '2026-02-25 18:34:11.847Z',
      'updated_at' => '2026-02-25 23:47:24.118Z',
    ),
    2 => 
    array (
      'id' => 'x4ndsksgbshe75e',
      'title' => 'E-commerce purchase',
      'description' => 'Imported via .ojf file',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Jane searches Google for top-rated espresso machines.","id":"n-6b17f934-9644-49c6-b717-3beb57221f95","score":7,"stageId":"s1","swimlaneId":"sl1","tags":["Search","Mobile"],"title":"Search for best coffee makers"},{"description":"Feeling optimistic about finding a great addition to the kitchen.","icon":"mood","iconColor":"#10b981","id":"n-67b59bad-c926-41ff-ae70-df1642e0c5d1","purpose":"observation","score":8,"sentiment":"positive","stageId":"s1","swimlaneId":"sl2","title":"Excitement"},{"description":"Reading blog posts and watching YouTube reviews.","id":"n-afcf89cd-afb0-4a93-bf57-2761eba6c806","score":6,"stageId":"s2","swimlaneId":"sl1","tags":["Research","Desktop"],"title":"Compare specs and reviews"},{"description":"Too many models and conflicting reviews make it hard to choose.","icon":"warning","iconColor":"#f59e0b","id":"n-7d057e0c-237f-4a0e-bab2-468069b0a5b8","purpose":"bottleneck","score":4,"sentiment":"confused","severity":"medium","stageId":"s2","swimlaneId":"sl3","title":"Information Overload"},{"description":"Decides on the \'BrewMaster Pro\' and completes the purchase.","icon":"shopping_cart","iconColor":"#4f46e5","id":"n-90747cb3-0707-4f3b-9210-f792720234bc","isMomentOfTruth":true,"purpose":"touchpoint","score":5,"stageId":"s3","swimlaneId":"sl1","tags":["Checkout","Mobile"],"title":"Select Product \\u0026 Checkout"},{"description":"Shipping costs were not shown until the very last step.","icon":"money_off","iconColor":"#ef4444","id":"n-631c3d57-f084-4c3f-b0b1-8260cebc1982","purpose":"pain-point","score":2,"sentiment":"angry","severity":"high","stageId":"s3","swimlaneId":"sl3","title":"Hidden Shipping Fees"},{"description":"Recedes the unit and follows the quick-start guide.","icon":"done_all","iconColor":"#10b981","id":"n-940bf556-e4a1-47c2-9004-cbabf91a93b6","purpose":"milestone","score":9,"sentiment":"delighted","stageId":"s4","swimlaneId":"sl1","tags":["Support","Product"],"title":"Unboxing \\u0026 Setup"}],"persona":"Jane Doe, First-time Homeowner","pointOfView":"Buying a high-end coffee maker for a new kitchen","stages":[{"id":"s1","name":"Discovery"},{"id":"s2","name":"Research"},{"id":"s3","name":"Purchase"},{"id":"s4","name":"Onboarding"}],"swimlanes":[{"id":"sl1","name":"User Actions"},{"id":"sl2","name":"Emotional State"},{"id":"sl3","name":"Pain Points"},{"id":"sl4","name":"Digital Touchpoints"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'active',
      'created_at' => '2026-02-25 18:37:50.850Z',
      'updated_at' => '2026-02-26 00:09:26.687Z',
    ),
    3 => 
    array (
      'id' => 'p3u1vc9icy6fcn7',
      'title' => 'Template: B2b Software Purchase',
      'description' => 'Imported from sample library.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Searches G2 and Gartner for \'Enterprise PM tools\'. Reads top 3 vendor websites.","iconColor":"#ffffff","id":"n1","isMomentOfTruth":false,"purpose":"action","score":5,"sentiment":"neutral","severity":"low","stageId":"s1","swimlaneId":"sl1","tags":["research"],"title":"Search for Solutions"},{"description":"Vendor site is clear, but pricing is hidden behind \'Contact Sales\'.","iconColor":"#fee2e2","id":"n2","isMomentOfTruth":false,"purpose":"touchpoint","score":4,"sentiment":"frustrated","severity":"medium","stageId":"s1","swimlaneId":"sl2","tags":["friction"],"title":"Marketing Website"},{"description":"Fills out the lead gen form to schedule a demo.","iconColor":"#ffffff","id":"n3","isMomentOfTruth":false,"purpose":"action","score":5,"sentiment":"neutral","severity":"low","stageId":"s2","swimlaneId":"sl1","tags":["sales"],"title":"Request Demo"},{"description":"Account Executive gives a tailored presentation. The product looks like it solves the pain points.","iconColor":"#dcfce7","id":"n4","isMomentOfTruth":true,"purpose":"touchpoint","score":8,"sentiment":"positive","severity":"low","stageId":"s2","swimlaneId":"sl2","tags":["sales"],"title":"Live Product Demo"},{"description":"Internal security team requires a 100-question vendor risk assessment.","iconColor":"#fee2e2","id":"n5","isMomentOfTruth":true,"purpose":"bottleneck","score":3,"sentiment":"anxious","severity":"high","stageId":"s3","swimlaneId":"sl4","tags":["compliance"],"title":"InfoSec Review"},{"description":"Vendor provides a self-serve Trust Center with SOC2 reports, speeding up the InfoSec review.","iconColor":"#e0f2fe","id":"n6","isMomentOfTruth":false,"purpose":"opportunity","score":9,"sentiment":"relieved","severity":"low","stageId":"s3","swimlaneId":"sl2","tags":["compliance","win"],"title":"Trust Center"},{"description":"Procurement team goes back and forth on the MSA terms.","iconColor":"#ffffff","id":"n7","isMomentOfTruth":false,"purpose":"action","score":4,"sentiment":"frustrated","severity":"medium","stageId":"s4","swimlaneId":"sl1","tags":["legal"],"title":"Legal Redlines"},{"description":"Deal is signed via DocuSign. Welcome email dispatched.","iconColor":"#dcfce7","id":"n8","isMomentOfTruth":true,"purpose":"milestone","score":8,"sentiment":"delighted","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["legal"],"title":"Contract Signature"},{"description":"Customer Success Manager hosts a welcome call and sets up the implementation timeline.","iconColor":"#ffffff","id":"n9","isMomentOfTruth":false,"purpose":"touchpoint","score":7,"sentiment":"positive","severity":"low","stageId":"s5","swimlaneId":"sl2","tags":["onboarding"],"title":"Kickoff Call"}],"persona":"IT Director","pointOfView":"Procuring a new project management suite for the enterprise","stages":[{"id":"s1","name":"1. Awareness \\u0026 Research"},{"id":"s2","name":"2. Evaluation \\u0026 Demo"},{"id":"s3","name":"3. Security \\u0026 Compliance"},{"id":"s4","name":"4. Procurement \\u0026 Contract"},{"id":"s5","name":"5. Go-Live \\u0026 Onboarding"}],"swimlanes":[{"id":"sl1","name":"Customer Actions"},{"id":"sl2","name":"Vendor Touchpoints"},{"id":"sl3","name":"Emotional State"},{"id":"sl4","name":"Internal Blockers"}],"version":"1.0"}',
      'folder' => 'Tests',
      'journey_status' => 'active',
      'created_at' => '2026-02-25 22:57:01.597Z',
      'updated_at' => '2026-02-26 10:30:48.718Z',
    ),
    4 => 
    array (
      'id' => '84yhw9b65nf1aqi',
      'title' => 'Template: Self Guided Tutorial',
      'description' => 'Imported from sample library.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"It\'s easiest to start outlining your journey in the Table Editor. Use the buttons below the header to toggle back and forth.","iconColor":"#ffffff","id":"n1","isMomentOfTruth":false,"purpose":"note","score":6,"sentiment":"surprised","severity":"low","stageId":"s1","swimlaneId":"sl1","tags":["basics"],"title":"Start in Table Mode"},{"description":"Stages are chronological phases (Columns). Swimlanes are the types of data you want to track (Rows). They form your Map Grid.","iconColor":"#ffffff","id":"n2","isMomentOfTruth":false,"purpose":"touchpoint","score":7,"sentiment":"delighted","severity":"low","stageId":"s1","swimlaneId":"sl2","tags":["structure"],"title":"Columns vs Rows"},{"description":"The visual map draws everything automatically! You can drag and drop these cards to move them between stages and lanes.","iconColor":"#ffffff","id":"n3","isMomentOfTruth":true,"purpose":"opportunity","score":8,"sentiment":"surprised","severity":"low","stageId":"s2","swimlaneId":"sl1","tags":["visuals"],"title":"Welcome to the Map!"},{"description":"You can click on the column and row headers straight from the visual map to rename them instantly without going back to the table!","iconColor":"#ffffff","id":"n4","isMomentOfTruth":false,"purpose":"gain","score":6,"sentiment":"relieved","severity":"medium","stageId":"s2","swimlaneId":"sl3","tags":["productivity"],"title":"Inline Editing"},{"description":"Click any card to open its editor. Try changing my color, icon, tags, or emotional score and see how I update in real-time.","iconColor":"#e0f2fe","id":"n5","isMomentOfTruth":false,"purpose":"touchpoint","score":9,"sentiment":"positive","severity":"low","stageId":"s3","swimlaneId":"sl1","tags":["interaction"],"title":"Editing Nodes"},{"description":"If a step is critical to the customer journey (where they might abandon the process), toggle the \'Moment of Truth\' switch. It gets a special star.","iconColor":"#fee2e2","id":"n6","isMomentOfTruth":true,"purpose":"bottleneck","score":4,"sentiment":"anxious","severity":"high","stageId":"s3","swimlaneId":"sl3","tags":["danger"],"title":"Moments of Truth"},{"description":"Turn on Feedback Mode using the toggle in the header. You can drop pins securely on the map, or right onto specific nodes.","iconColor":"#ffedd5","id":"n7","isMomentOfTruth":false,"purpose":"gain","score":8,"sentiment":"delighted","severity":"low","stageId":"s4","swimlaneId":"sl1","tags":["magic"],"title":"Feedback Mode"},{"description":"See that blue line tracking across the map? That\'s drawn automatically based on the 1-10 \'Score\' value assigned inside the node editor.","iconColor":"#ffffff","id":"n8","isMomentOfTruth":false,"purpose":"note","score":9,"sentiment":"surprised","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["magic"],"title":"Emotional Curves"},{"description":"Export the map as an .ojf (OpenJourney Format) JSON file. It\'s fully open source and yours forever.","iconColor":"#ffffff","id":"n9","isMomentOfTruth":false,"purpose":"touchpoint","score":8,"sentiment":"relieved","severity":"low","stageId":"s5","swimlaneId":"sl1","tags":["export"],"title":"JSON Portability"},{"description":"Click the Export button to instantly generate a Markdown brief or a PDF Text Report containing all node data and resolved feedback!","iconColor":"#dcfce7","id":"n10","isMomentOfTruth":true,"purpose":"milestone","score":10,"sentiment":"delighted","severity":"low","stageId":"s5","swimlaneId":"sl2","tags":["export"],"title":"Generated Reports"}],"persona":"New User","pointOfView":"Learning how to use Ptolemy","stages":[{"id":"s1","name":"1. The Table Editor"},{"id":"s2","name":"2. The Visual Map"},{"id":"s3","name":"3. The Data (NodeCards)"},{"id":"s4","name":"4. Magic Features"},{"id":"s5","name":"5. Outputs"}],"swimlanes":[{"id":"sl1","name":"User Actions"},{"id":"sl2","name":"Thoughts \\u0026 Feelings"},{"id":"sl3","name":"Friction Points"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'trash',
      'created_at' => '2026-02-25 22:57:50.151Z',
      'updated_at' => '2026-02-26 10:30:29.413Z',
    ),
    5 => 
    array (
      'id' => '30ivdaayuk4vcul',
      'title' => 'Template: Ecommerce Return',
      'description' => 'Imported from sample library.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Sarah opens the delivery and discovers the sweater has a tear in the sleeve.","iconColor":"#fee2e2","id":"n1","isMomentOfTruth":true,"purpose":"action","score":3,"sentiment":"upset","severity":"medium","stageId":"s1","swimlaneId":"sl1","tags":["offline"],"title":"Opens Package"},{"description":"Goes to the website on her phone to find the return policy. It is buried in the footer.","iconColor":"#ffffff","id":"n2","isMomentOfTruth":false,"purpose":"touchpoint","score":4,"sentiment":"frustrated","severity":"low","stageId":"s1","swimlaneId":"sl2","tags":["mobile"],"title":"Checks Return Policy"},{"description":"Logs into the return portal. The system cannot find her order number automatically.","iconColor":"#fee2e2","id":"n3","isMomentOfTruth":true,"purpose":"bottleneck","score":2,"sentiment":"angry","severity":"high","stageId":"s2","swimlaneId":"sl2","tags":["bug","friction"],"title":"Return Portal"},{"description":"The portal says there is a $5 return shipping fee, even though the item arrived damaged.","iconColor":"#fecaca","id":"n4","isMomentOfTruth":true,"purpose":"pain","score":1,"sentiment":"angry","severity":"high","stageId":"s2","swimlaneId":"sl4","tags":["policy"],"title":"Restocking Fee"},{"description":"Sarah opens live chat to get the fee waived. The bot is unhelpful, but a human agent finally waives it.","iconColor":"#fef08a","id":"n5","isMomentOfTruth":false,"purpose":"touchpoint","score":6,"sentiment":"relieved","severity":"medium","stageId":"s2","swimlaneId":"sl2","tags":["support"],"title":"Live Chat Support"},{"description":"Sarah has to find a friend with a printer to print the return label.","iconColor":"#ffffff","id":"n6","isMomentOfTruth":false,"purpose":"action","score":4,"sentiment":"frustrated","severity":"medium","stageId":"s3","swimlaneId":"sl3","tags":["offline"],"title":"Printing Label"},{"description":"Drives 15 minutes to drop the package off at a shipping center.","iconColor":"#ffffff","id":"n7","isMomentOfTruth":false,"purpose":"action","score":5,"sentiment":"neutral","severity":"low","stageId":"s3","swimlaneId":"sl3","tags":["offline"],"title":"Drop off at Carrier"},{"description":"It has been 10 days and there is no email confirming the return was processed.","iconColor":"#fee2e2","id":"n8","isMomentOfTruth":true,"purpose":"pain","score":3,"sentiment":"anxious","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["communication"],"title":"Radio Silence"},{"description":"Finally receives the refund notification. Will probably not shop here again.","iconColor":"#ffffff","id":"n9","isMomentOfTruth":false,"purpose":"milestone","score":5,"sentiment":"neutral","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["finance"],"title":"Refund Issued"}],"persona":"Online Shopper (Sarah)","pointOfView":"Trying to return a defective sweater she bought online","stages":[{"id":"s1","name":"1. Discovery \\u0026 Frustration"},{"id":"s2","name":"2. Initiating Return"},{"id":"s3","name":"3. Shipping it Back"},{"id":"s4","name":"4. Waiting for Refund"}],"swimlanes":[{"id":"sl1","name":"Customer Actions"},{"id":"sl2","name":"Digital Touchpoints"},{"id":"sl3","name":"Physical Touchpoints"},{"id":"sl4","name":"Pain Points"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'trash',
      'created_at' => '2026-02-25 22:59:26.923Z',
      'updated_at' => '2026-02-26 10:30:24.489Z',
    ),
    6 => 
    array (
      'id' => '3yh7sdhjgvbp7d7',
      'title' => 'Template: Ecommerce Return',
      'description' => 'Imported from sample library.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Sarah opens the delivery and discovers the sweater has a tear in the sleeve.","iconColor":"#fee2e2","id":"n1","isMomentOfTruth":true,"purpose":"action","score":-2,"sentiment":"upset","severity":"medium","stageId":"s1","swimlaneId":"sl1","tags":["offline"],"title":"Opens Package"},{"description":"Goes to the website on her phone to find the return policy. It is buried in the footer.","iconColor":"#ffffff","id":"n2","isMomentOfTruth":false,"purpose":"touchpoint","score":-1,"sentiment":"frustrated","severity":"low","stageId":"s1","swimlaneId":"sl2","tags":["mobile"],"title":"Checks Return Policy"},{"description":"Logs into the return portal. The system cannot find her order number automatically.","iconColor":"#fee2e2","id":"n3","isMomentOfTruth":true,"purpose":"bottleneck","score":-3,"sentiment":"angry","severity":"high","stageId":"s2","swimlaneId":"sl2","tags":["bug","friction"],"title":"Return Portal"},{"description":"The portal says there is a $5 return shipping fee, even though the item arrived damaged.","iconColor":"#fecaca","id":"n4","isMomentOfTruth":true,"purpose":"pain","score":-4,"sentiment":"angry","severity":"high","stageId":"s2","swimlaneId":"sl4","tags":["policy"],"title":"Restocking Fee"},{"description":"Sarah opens live chat to get the fee waived. The bot is unhelpful, but a human agent finally waives it.","iconColor":"#fef08a","id":"n5","isMomentOfTruth":false,"purpose":"touchpoint","score":1,"sentiment":"relieved","severity":"medium","stageId":"s2","swimlaneId":"sl2","tags":["support"],"title":"Live Chat Support"},{"description":"Sarah has to find a friend with a printer to print the return label.","iconColor":"#ffffff","id":"n6","isMomentOfTruth":false,"purpose":"action","score":-1,"sentiment":"frustrated","severity":"medium","stageId":"s3","swimlaneId":"sl3","tags":["offline"],"title":"Printing Label"},{"description":"Drives 15 minutes to drop the package off at a shipping center.","iconColor":"#ffffff","id":"n7","isMomentOfTruth":false,"purpose":"action","score":0,"sentiment":"neutral","severity":"low","stageId":"s3","swimlaneId":"sl3","tags":["offline"],"title":"Drop off at Carrier"},{"description":"It has been 10 days and there is no email confirming the return was processed.","iconColor":"#fee2e2","id":"n8","isMomentOfTruth":true,"purpose":"pain","score":-2,"sentiment":"anxious","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["communication"],"title":"Radio Silence"},{"description":"Finally receives the refund notification. Will probably not shop here again.","iconColor":"#ffffff","id":"n9","isMomentOfTruth":false,"purpose":"milestone","score":0,"sentiment":"neutral","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["finance"],"title":"Refund Issued"}],"persona":"Online Shopper (Sarah)","pointOfView":"Trying to return a defective sweater she bought online","stages":[{"id":"s1","name":"1. Discovery \\u0026 Frustration"},{"id":"s2","name":"2. Initiating Return"},{"id":"s3","name":"3. Shipping it Back"},{"id":"s4","name":"4. Waiting for Refund"}],"swimlanes":[{"id":"sl1","name":"Customer Actions"},{"id":"sl2","name":"Digital Touchpoints"},{"id":"sl3","name":"Physical Touchpoints"},{"id":"sl4","name":"Pain Points"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'trash',
      'created_at' => '2026-02-25 23:18:14.340Z',
      'updated_at' => '2026-02-26 10:30:19.400Z',
    ),
    7 => 
    array (
      'id' => '3hxqrsapy413joi',
      'title' => 'Template: B2b Software Purchase',
      'description' => 'Imported from sample library.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Searches G2 and Gartner for \'Enterprise PM tools\'. Reads top 3 vendor websites.","iconColor":"#ffffff","id":"n1","isMomentOfTruth":false,"purpose":"action","score":0,"sentiment":"neutral","severity":"low","stageId":"s1","swimlaneId":"sl1","tags":["research"],"title":"Search for Solutions"},{"description":"Vendor site is clear, but pricing is hidden behind \'Contact Sales\'.","iconColor":"#fee2e2","id":"n2","isMomentOfTruth":false,"purpose":"touchpoint","score":-1,"sentiment":"frustrated","severity":"medium","stageId":"s1","swimlaneId":"sl2","tags":["friction"],"title":"Marketing Website"},{"description":"Fills out the lead gen form to schedule a demo.","iconColor":"#ffffff","id":"n3","isMomentOfTruth":false,"purpose":"action","score":0,"sentiment":"neutral","severity":"low","stageId":"s2","swimlaneId":"sl1","tags":["sales"],"title":"Request Demo"},{"description":"Account Executive gives a tailored presentation. The product looks like it solves the pain points.","iconColor":"#dcfce7","id":"n4","isMomentOfTruth":true,"purpose":"touchpoint","score":3,"sentiment":"positive","severity":"low","stageId":"s2","swimlaneId":"sl2","tags":["sales"],"title":"Live Product Demo"},{"description":"Internal security team requires a 100-question vendor risk assessment.","iconColor":"#fee2e2","id":"n5","isMomentOfTruth":true,"purpose":"bottleneck","score":-2,"sentiment":"anxious","severity":"high","stageId":"s3","swimlaneId":"sl4","tags":["compliance"],"title":"InfoSec Review"},{"description":"Vendor provides a self-serve Trust Center with SOC2 reports, speeding up the InfoSec review.","iconColor":"#e0f2fe","id":"n6","isMomentOfTruth":false,"purpose":"opportunity","score":4,"sentiment":"relieved","severity":"low","stageId":"s3","swimlaneId":"sl2","tags":["compliance","win"],"title":"Trust Center"},{"description":"Procurement team goes back and forth on the MSA terms.","iconColor":"#ffffff","id":"n7","isMomentOfTruth":false,"purpose":"action","score":-1,"sentiment":"frustrated","severity":"medium","stageId":"s4","swimlaneId":"sl1","tags":["legal"],"title":"Legal Redlines"},{"description":"Deal is signed via DocuSign. Welcome email dispatched.","iconColor":"#dcfce7","id":"n8","isMomentOfTruth":true,"purpose":"milestone","score":3,"sentiment":"delighted","severity":"low","stageId":"s4","swimlaneId":"sl2","tags":["legal"],"title":"Contract Signature"},{"description":"Customer Success Manager hosts a welcome call and sets up the implementation timeline.","iconColor":"#ffffff","id":"n9","isMomentOfTruth":false,"purpose":"touchpoint","score":2,"sentiment":"positive","severity":"low","stageId":"s5","swimlaneId":"sl2","tags":["onboarding"],"title":"Kickoff Call"}],"persona":"IT Director","pointOfView":"Procuring a new project management suite for the enterprise","stages":[{"id":"s1","name":"1. Awareness \\u0026 Research"},{"id":"s2","name":"2. Evaluation \\u0026 Demo"},{"id":"s3","name":"3. Security \\u0026 Compliance"},{"id":"s4","name":"4. Procurement \\u0026 Contract"},{"id":"s5","name":"5. Go-Live \\u0026 Onboarding"}],"swimlanes":[{"id":"sl1","name":"Customer Actions"},{"id":"sl2","name":"Vendor Touchpoints"},{"id":"sl3","name":"Emotional State"},{"id":"sl4","name":"Internal Blockers"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'active',
      'created_at' => '2026-02-26 14:30:55.015Z',
      'updated_at' => '2026-02-26 14:30:55.015Z',
    ),
    8 => 
    array (
      'id' => 'f5taybt9t3whnb6',
      'title' => 'Template: Ecommerce Purchase',
      'description' => 'Imported from sample library.',
      'owner_id' => '0wko8ajbcdqlmlx',
      'ojf_data' => '{"nodes":[{"description":"Jane searches Google for top-rated espresso machines.","id":"n-a5748fc7-2036-44a8-98fb-d2d842bddc1d","score":2,"stageId":"s1","swimlaneId":"sl1","tags":["Search","Mobile"],"title":"Search for best coffee makers"},{"description":"Feeling optimistic about finding a great addition to the kitchen.","icon":"mood","iconColor":"#10b981","id":"n-6f2436ee-44b2-4def-a2d4-60c6b77ce979","purpose":"observation","score":3,"sentiment":"positive","stageId":"s1","swimlaneId":"sl2","title":"Excitement"},{"description":"Reading blog posts and watching YouTube reviews.","id":"n-e7c1855e-5f81-4f58-a171-4d4f48bfe99d","score":1,"stageId":"s2","swimlaneId":"sl1","tags":["Research","Desktop"],"title":"Compare specs and reviews"},{"description":"Too many models and conflicting reviews make it hard to choose.","icon":"warning","iconColor":"#f59e0b","id":"n-21d2e1e1-29b5-497f-9165-8eab1e28b524","purpose":"bottleneck","score":-1,"sentiment":"confused","severity":"medium","stageId":"s2","swimlaneId":"sl3","title":"Information Overload"},{"description":"Decides on the \'BrewMaster Pro\' and completes the purchase.","icon":"shopping_cart","iconColor":"#4f46e5","id":"n-4649e82b-83b8-4690-a88b-4960b56fb90f","isMomentOfTruth":true,"purpose":"touchpoint","score":0,"stageId":"s3","swimlaneId":"sl1","tags":["Checkout","Mobile"],"title":"Select Product \\u0026 Checkout"},{"description":"Shipping costs were not shown until the very last step.","icon":"money_off","iconColor":"#ef4444","id":"n-0b020e33-eaaf-4244-a7e2-ed5143f98ee6","purpose":"pain-point","score":-3,"sentiment":"angry","severity":"high","stageId":"s3","swimlaneId":"sl3","title":"Hidden Shipping Fees"},{"description":"Recedes the unit and follows the quick-start guide.","icon":"done_all","iconColor":"#10b981","id":"n-3bd3e8a7-fd73-4949-983a-580d4f77a829","purpose":"milestone","score":4,"sentiment":"delighted","stageId":"s4","swimlaneId":"sl1","tags":["Support","Product"],"title":"Unboxing \\u0026 Setup"}],"persona":"Jane Doe, First-time Homeowner","pointOfView":"Buying a high-end coffee maker for a new kitchen","stages":[{"id":"s1","name":"Discovery"},{"id":"s2","name":"Research"},{"id":"s3","name":"Purchase"},{"id":"s4","name":"Onboarding"}],"swimlanes":[{"id":"sl1","name":"User Actions"},{"id":"sl2","name":"Emotional State"},{"id":"sl3","name":"Pain Points"},{"id":"sl4","name":"Digital Touchpoints"}],"version":"1.0"}',
      'folder' => '',
      'journey_status' => 'active',
      'created_at' => '2026-02-26 18:04:46.286Z',
      'updated_at' => '2026-02-26 18:04:46.286Z',
    ),
  ),
  'comments' => 
  array (
    0 => 
    array (
      'id' => '1tdy7zi9v57sk9j',
      'journey_id' => 'x4ndsksgbshe75e',
      'user_id' => '0wko8ajbcdqlmlx',
      'content' => 'Exciting comment',
      'x' => 26.96078431372549,
      'y' => 33.677734375,
      'node_id' => 'n-67b59bad-c926-41ff-ae70-df1642e0c5d1',
      'parent_id' => '',
      'resolved' => 1,
      'created_at' => '2026-02-25 22:38:59.523Z',
    ),
    1 => 
    array (
      'id' => 'bcb9wesg3avxxa7',
      'journey_id' => 'x4ndsksgbshe75e',
      'user_id' => '0wko8ajbcdqlmlx',
      'content' => 'This is fine',
      'x' => 26.96078431372549,
      'y' => 33.677734375,
      'node_id' => 'n-67b59bad-c926-41ff-ae70-df1642e0c5d1',
      'parent_id' => '1tdy7zi9v57sk9j',
      'resolved' => 0,
      'created_at' => '2026-02-25 22:39:19.363Z',
    ),
  ),
  'invites' => 
  array (
    0 => 
    array (
      'id' => 'zknr4iegahwt6da',
      'token' => '7e9db8a7211c93f7',
      'invited_by_id' => '0wko8ajbcdqlmlx',
      'is_used' => 0,
      'created_at' => '2026-02-25 17:27:13.704Z',
    ),
  ),
);
}

function seedPocketBaseData($pdo, $targetUserId = null) {
    $data = getPocketBaseSeedData();
    $seeded = ["users" => 0, "journeys" => 0, "comments" => 0, "invites" => 0];

    // 1. Ensure user exists
    $adminUserId = $targetUserId;
    if (!$adminUserId) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute(["andy@andrewwestley.co.uk"]);
        $userRow = $stmt->fetch();
        if ($userRow) {
            $adminUserId = $userRow["id"];
        }
    }

    if (!$adminUserId) {
        // Insert original user from PocketBase
        $origUser = $data["users"][0] ?? null;
        if ($origUser) {
            $stmt = $pdo->prepare("
                INSERT INTO users (id, name, email, password_hash, is_admin)
                VALUES (?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE is_admin = 1
            ");
            $stmt->execute([
                $origUser["id"],
                $origUser["name"] ?: "Andy Westley",
                $origUser["email"],
                $origUser["password_hash"]
            ]);
            $adminUserId = $origUser["id"];
            $seeded["users"]++;
        }
    }

    if (!$adminUserId) {
        $adminUserId = "0wko8ajbcdqlmlx";
    }

    // 2. Insert Journeys
    $stmtJourney = $pdo->prepare("
        INSERT INTO journeys (id, title, description, owner_id, ojf_data, folder, journey_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            title = VALUES(title),
            description = VALUES(description),
            owner_id = VALUES(owner_id),
            ojf_data = VALUES(ojf_data),
            folder = VALUES(folder),
            journey_status = VALUES(journey_status)
    ");

    foreach ($data["journeys"] as $j) {
        // Assign owner to current admin user so journeys belong to them
        $ownerId = $adminUserId;
        $created = !empty($j["created_at"]) ? str_replace("T", " ", substr($j["created_at"], 0, 19)) : date("Y-m-d H:i:s");
        $updated = !empty($j["updated_at"]) ? str_replace("T", " ", substr($j["updated_at"], 0, 19)) : date("Y-m-d H:i:s");
        
        $stmtJourney->execute([
            $j["id"],
            $j["title"],
            $j["description"] ?? "",
            $ownerId,
            $j["ojf_data"],
            $j["folder"] ?? "",
            $j["journey_status"] ?? "active",
            $created,
            $updated
        ]);
        $seeded["journeys"]++;
    }

    // 3. Insert Comments
    $stmtComment = $pdo->prepare("
        INSERT INTO comments (id, journey_id, user_id, content, x, y, node_id, parent_id, resolved, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            content = VALUES(content),
            resolved = VALUES(resolved)
    ");

    foreach ($data["comments"] as $c) {
        $created = !empty($c["created_at"]) ? str_replace("T", " ", substr($c["created_at"], 0, 19)) : date("Y-m-d H:i:s");
        $stmtComment->execute([
            $c["id"],
            $c["journey_id"],
            $adminUserId,
            $c["content"],
            floatval($c["x"]),
            floatval($c["y"]),
            $c["node_id"] ?? null,
            $c["parent_id"] ?? null,
            (int)($c["resolved"] ?? 0),
            $created
        ]);
        $seeded["comments"]++;
    }

    // 4. Insert Invites
    $stmtInvite = $pdo->prepare("
        INSERT INTO invites (id, token, invited_by_id, is_used, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            is_used = VALUES(is_used)
    ");

    foreach ($data["invites"] as $inv) {
        $created = !empty($inv["created_at"]) ? str_replace("T", " ", substr($inv["created_at"], 0, 19)) : date("Y-m-d H:i:s");
        $stmtInvite->execute([
            $inv["id"],
            $inv["token"],
            $adminUserId,
            (int)($inv["is_used"] ?? 0),
            $created
        ]);
        $seeded["invites"]++;
    }

    return $seeded;
}
