// Source: certified translation "ترجمة برايمكس_2062.pdf" (Amicus Populo), 26 clauses.
// Bump TERMS_VERSION whenever any text below changes; signed cards keep the version they accepted.
export const TERMS_VERSION = "2026-11-v1";

export type Lang = "en" | "ar";

type Text = Record<Lang, string>;

export const TEXT = {
  termsTitle: {
    en: "TERMS & CONDITIONS VEHICLE SERVICE, PROTECTION & DETAILING",
    ar: "الشروط والأحكام لخدمة المركبات والحماية والتلميع",
  },
  termsImportant: {
    en: "IMPORTANT: TERMS & CONDITIONS ON THE REVERSE SIDE FORM AN INTEGRAL PART OF THIS JOB CARD.",
    ar: "هام: تشكل الشروط والأحكام الموجودة على الوجه الخلفي جزءاً لا يتجزأ من بطاقة العمل هذه.",
  },
  termsIntro: {
    en: "These Terms & Conditions form an integral part of the Job Card and apply to all services provided by Primex Tinting & Protection Centre, including PPF, window tinting, ceramic/nano coating, polishing, paint correction, interior detailing, exterior detailing, cleaning and related vehicle services. By signing the front side of the Job Card, the customer or authorized representative confirms that these Terms & Conditions have been made available, read, understood and accepted.",
    // The certified Arabic renders the centre's name garbled ("فورباي فورانتريز ايسس"); the name below is normalised.
    ar: "تشكل هذه الشروط والأحكام جزءاً لا يتجزأ من بطاقة العمل، وتنطبق على جميع الخدمات المقدمة من مركز برايمكس للتظليل والحماية، بما في ذلك أفلام حماية الطلاء، وتظليل النوافذ، والطلاء السيراميكي/النانو، والتلميع، وتصحيح الطلاء، وتنظيف المقصورة الداخلية، وتنظيف الهيكل الخارجي، والتنظيف والخدمات المتعلقة بالمركبات. بالتوقيع على الوجه الأمامي لبطاقة العمل، يقرّ العميل أو الممثل المعتمد بأن هذه الشروط والأحكام قد تم إتاحتها له، وقراءتها، وفهمها، وقبولها.",
  },
  termsFooter: {
    en: "IMPORTANT: BY SIGNING THE FRONT SIDE OF THIS JOB CARD, THE CUSTOMER CONFIRMS ACCEPTANCE OF THESE TERMS & CONDITIONS.",
    ar: "هام: بالتوقيع على الوجه الأمامي لبطاقة العمل هذه، يقر العميل بقبوله لهذه الشروط والأحكام.",
  },
  checkinTitle: { en: "CUSTOMER CHECK-IN & TERMS ACKNOWLEDGEMENT", ar: "إقرار استلام العميل والشروط" },
  checkinText: {
    en: "By signing this Job Card, I confirm that I have handed over the vehicle for the services stated above and that the Terms & Conditions printed on the reverse side have been made available to me. I confirm that I have read, understood and accepted those Terms & Conditions and authorize Primex to carry out the selected services. I also confirm that the information provided by me regarding the vehicle, including previous repainting, repairs, modifications and known defects, is accurate and complete.",
    ar: "بالتوقيع على بطاقة العمل هذه، أؤكد أنني قمت بتسليم المركبة للخدمات المذكورة أعلاه، وأن الشروط والأحكام المطبوعة على الوجه الخلفي قد تم إتاحتها لي. أؤكد أنني قد قرأت وفهمت وقبلت تلك الشروط والأحكام، وأصرح لشركة برايمكس بتنفيذ الخدمات المختارة. كما أؤكد أن المعلومات المقدمة من قبلي بخصوص المركبة، بما في ذلك عمليات إعادة الطلاء السابقة والإصلاحات والتعديلات والعيوب المعروفة، دقيقة وكاملة.",
  },
  repName: { en: "Customer / Authorized Representative", ar: "العميل / الممثل المعتمد" },
  deliveryTitle: { en: "CUSTOMER DELIVERY ACKNOWLEDGEMENT", ar: "إقرار تسليم المركبة للعميل" },
  deliveryText: {
    en: "I confirm that I have inspected the vehicle and completed services at the time of delivery and have received the vehicle in satisfactory condition.",
    // Not in the certified translation (it covers check-in only) — translated in-house, have it verified.
    ar: "أؤكد أنني قمت بفحص المركبة والخدمات المنجزة وقت التسليم، وأنني استلمت المركبة بحالة مرضية.",
  },
  acceptRead: {
    en: "I have read and agree to the Terms and Conditions.",
    ar: "لقد قرأت الشروط والأحكام وأوافق عليها.",
  },
  acceptQuick: { en: "I agree to the Terms and Conditions.", ar: "أوافق على الشروط والأحكام." },
} satisfies Record<string, Text>;

export const CLAUSES: { en: [string, string]; ar: [string, string] }[] = [
  {
    en: ["CUSTOMER AUTHORIZATION", "The vehicle must be delivered by the owner or an authorized representative. The person delivering the vehicle confirms that they are authorized to request and approve the services."],
    ar: ["تفويض العميل", "يجب تسليم المركبة من قبل المالك أو ممثل معتمد. يقر الشخص الذي يقوم بتسليم المركبة بأنه مخوّل بالموافقة على الخدمات وطلبها."],
  },
  {
    en: ["CUSTOMER & VEHICLE INFORMATION", "The customer must provide accurate and complete vehicle/contact information and inform Primex of previous repairs, repainting, modifications, damage, defects or other conditions that may affect the service."],
    ar: ["معلومات العميل والمركبة", "يجب على العميل تقديم معلومات دقيقة وكاملة عن المركبة ووسائل الاتصال، وإبلاغ شركة برايمكس بأي إصلاحات سابقة، أو إعادة طلاء، أو تعديلات، أو أضرار، أو عيوب، أو أي ظروف أخرى قد تؤثر على الخدمة."],
  },
  {
    en: ["VEHICLE CONDITION & INSPECTION", "Primex will make a reasonable inspection and may take photographs/videos. Not all defects or previous repairs can be identified when a vehicle is dusty, dirty, wet or otherwise unsuitable for inspection. Where necessary, Primex may wash/clean the vehicle before final inspection. Conditions identified after washing may be documented and shared with the customer by photographs/videos before proceeding where appropriate."],
    ar: ["حالة المركبة والفحص", "ستقوم شركة برايمكس بإجراء فحص معقول وقد تأخذ صوراً/مقاطع فيديو. لا يمكن تحديد جميع العيوب أو الإصلاحات السابقة عندما تكون المركبة متسخة، أو رطبة، أو غير مناسبة للفحص بأي شكل آخر. عند الضرورة، قد تقوم شركة برايمكس بغسل/تنظيف المركبة قبل الفحص النهائي. سيتم توثيق الحالات التي تم تحديدها بعد الغسل ومشاركتها مع العميل عبر الصور/مقاطع الفيديو قبل المتابعة حيثما كان ذلك مناسباً."],
  },
  {
    en: ["PRE-EXISTING & CONCEALED CONDITIONS", "Existing scratches, dents, stone chips, paint defects, corrosion, peeling/weak paint, damaged trim, cracked/weak glass, previous repairs, modifications, aftermarket accessories and other pre-existing or concealed conditions remain the customer's responsibility unless otherwise agreed in writing. Consequences arising from such conditions are not Primex's responsibility to the extent permitted by law."],
    ar: ["العيوب الموجودة مسبقاً والمخفية", "تظل الخدوش الموجودة، والانبعاجات، ورقائق الحجر، وعيوب الطلاء، والتآكل/الضعف في الطلاء، والحواف التالفة، والزجاج المتشقق/الضعيف، والإصلاحات السابقة، والتعديلات، والملحقات غير الأصلية، وغيرها من العيوب الموجودة مسبقاً أو المخفية، مسؤولية العميل ما لم يُتفق على خلاف ذلك كتابياً. لا تقع العواقب الناشئة عن هذه الظروف على عاتق شركة برايمكس، وذلك في حدود ما يسمح به القانون."],
  },
  {
    en: ["PREVIOUS REPAINTING & BODY REPAIRS", "The customer must inform Primex before work begins if any part of the vehicle has been painted, repainted, repaired, touched up, refinished or modified. If relevant information is not disclosed, Primex shall not be responsible, to the extent permitted by law, for damage or consequences arising from such undisclosed or underlying conditions, including paint lifting, peeling or adhesion issues."],
    ar: ["إعادة الطلاء والإصلاحات السابقة للهيكل", "يجب على العميل إبلاغ شركة برايمكس قبل بدء العمل إذا تم طلاء أي جزء من المركبة، أو إعادة طلائه، أو إصلاحه، أو لمسه، أو تجديده، أو تعديله. إذا لم يتم الإفصاح عن المعلومات ذات الصلة، فلن تكون شركة برايمكس مسؤولة، في حدود ما يسمح به القانون، عن أي ضرر أو عواقب ناشئة عن هذه الظروف غير المفصح عنها أو الكامنة، بما في ذلك تقشر الطلاء، أو تلفه، أو مشاكل الالتصاق."],
  },
  {
    en: ["PPF, WINDOW TINT & ADHESIVE FILMS", "These services require proper preparation and installation conditions. Minor visual variations, moisture or edge settling may occur during curing. Existing weak paint, previous repainting, touch-ups or body repairs may affect installation, adhesion or removal. Pre-existing damage or weak surfaces affected during reasonable removal/installation are excluded to the extent permitted by law."],
    ar: ["أفلام حماية الطلاء، وتظليل النوافذ، والأفلام اللاصقة", "تتطلب هذه الخدمات تحضيراً وتركيباً مناسبين. قد تحدث اختلافات بسيطة في المظهر البصري، أو هامش، أو استقرار الحواف أثناء التركيب. قد يؤثر الطلاء القديم الموجود، أو إعادة الطلاء السابقة، أو اللمسات التجميلية، أو إصلاحات الهيكل على التركيب، أو التصاق الفيلم، أو إزالته. تُستثنى الأضرار الموجودة مسبقاً أو الأسطح الضعيفة المتأثرة بالإزالة المعقولة/التركيب، وذلك في حدود ما يسمح به القانون."],
  },
  {
    en: ["POLISHING & PAINT CORRECTION", "Results depend on paint condition and thickness. Complete removal of every scratch, swirl, stain or defect cannot be guaranteed. Aggressive correction may carry risk to clear coat/paint, especially on thin, repaired or repainted panels."],
    ar: ["التلميع وتصحيح الطلاء", "تعتمد النتائج على حالة الطلاء وسماكته. لا يمكن ضمان الإزالة الكاملة لكل خدش، أو دوامة، أو بقعة، أو عيب. قد يؤدي التلميع القوي إلى مخاطر تلف الطلاء، خاصة على الألواح الرقيقة، أو التالفة، أو المعاد طلاؤها."],
  },
  {
    en: ["CERAMIC / NANO COATING", "Coatings provide protection but do not make the vehicle scratch-proof or immune to stone chips, stains, chemicals, contamination or normal wear. Performance depends on preparation, curing and maintenance. Recommended aftercare must be followed."],
    ar: ["الطلاء السيراميكي / النانو", "توفر الطلاءات الحماية ولكنها لا تجعل المركبة مقاومة للخدوش أو محصنة ضد رقائق الحجر، أو البقع، أو المواد الكيميائية، أو التلوث، أو التآكل الطبيعي. يعتمد الأداء على التحضير، والمعالجة، والصيانة. يوصى بالعناية اللاحقة المشار إليها."],
  },
  {
    en: ["INTERIOR & EXTERIOR DETAILING", "Cleaning, steam cleaning, extraction, leather treatment and other detailing may reveal pre-existing deterioration such as fading, weak stitching, loose/damaged trim or electronics. Primex cannot guarantee that cleaning will not expose an existing defect."],
    ar: ["تنظيف المقصورة الداخلية والخارجية", "قد يكشف التنظيف، وتنظيف البخار، والاستخلاص، ومعالجة الجلود وغيرها من التفاصيل عن تدهور موجود مسبقاً مثل البهتان، أو الخياطة الضعيفة، أو التلبيس/الحواف المفكوكة، أو الإلكترونيات. لا تضمن شركة برايمكس أن التنظيف لن يؤدي إلى تفاقم أي عيب موجود."],
  },
  {
    en: ["GLASS, TRIM, SENSORS & ELECTRONICS", "The customer must disclose existing cracks/chips, damaged seals, loose trim, aftermarket electrical accessories, sensors or other known issues. Pre-existing or weakened glass may crack or expand during normal handling/service."],
    ar: ["الزجاج، والحواف، والمستشعرات، والإلكترونيات", "يجب على العميل الإفصاح عن الشقوق/الرقائق الموجودة، والحواف التالفة، والأختام المفكوكة، والملحقات الكهربائية غير الأصلية، أو المستشعرات، أو أي عيوب أخرى معروفة. قد يتشقق الزجاج أو الحواف الضعيفة الموجودة أو تتوسع أثناء المناولة/الخدمة العادية."],
  },
  {
    en: ["VEHICLE MOVEMENT / TEST DRIVING", "The customer authorizes Primex and its authorized employees to move and operate the vehicle within or outside the premises when reasonably necessary for inspection, service, parking, testing or delivery."],
    ar: ["حركة المركبة / قيادة الاختبار", "يخوّل العميل شركة برايمكس وموظفيها المعتمدين بنقل المركبة وتشغيلها داخل المبنى أو خارجه عندما يكون ذلك ضرورياً بشكل معقول للفحص، أو الخدمة، أو الركن، أو الاختبار، أو التسليم."],
  },
  {
    en: ["ADDITIONAL WORK", "If additional work is necessary, Primex will seek customer approval before carrying out additional chargeable work where reasonably practicable. Approved additional work forms part of the service order."],
    ar: ["العمل الإضافي", "إذا كان العمل الإضافي ضرورياً، ستطلب شركة برايمكس موافقة العميل قبل تنفيذ أي عمل إضافي قابل للتحصيل حيثما كان ذلك ممكناً بشكل معقول. يشكل العمل الإضافي المعتمد جزءاً من أمر الخدمة."],
  },
  {
    en: ["SERVICE COMPLETION & COLLECTION", "The customer will be informed when the vehicle is ready. The customer should inspect the vehicle and visible condition before taking delivery and report any apparent concern as soon as reasonably possible."],
    ar: ["إتمام الخدمة والاستلام", "سيتم إبلاغ العميل عندما تكون المركبة جاهزة. يجب على العميل فحص المركبة وحالتها الظاهرة قبل الاستلام والإبلاغ عن أي مخاوف واضحة في أقرب وقت ممكن بشكل معقول."],
  },
  {
    en: ["DELAYED COLLECTION & STORAGE", "Customers must collect completed vehicles promptly. Applicable parking/storage charges may apply after the agreed collection time as communicated by Primex. Vehicles left for extended periods may be moved to an appropriate parking/storage area."],
    ar: ["التأخر في الاستلام والتخزين", "يجب على العملاء استلام المركبات التي تم إتمامها على الفور. قد تُطبق رسوم ركن/تخزين قابلة للتطبيق بعد فترة الاستلام المتفق عليها كما يتم إبلاغها من قبل شركة برايمكس. قد يتم نقل المركبات المتروكة لفترات ممتدة إلى منطقة ركن/تخزين مناسبة."],
  },
  {
    en: ["DELIVERY TIMES & DELAYS", "Estimated completion times may change due to unforeseen circumstances, additional work, material availability, curing/drying, customer approvals, weather or other factors beyond reasonable control. Customer-caused delays may result in applicable additional charges."],
    ar: ["أوقات التسليم والتأخيرات", "قد تتغير أوقات الإنجاز المقدرة بسبب ظروف غير متوقعة، أو عمل إضافي، أو توفر المواد، أو المعالجة/التجفيف، أو موافقات العميل، أو الطقس، أو عوامل أخرى خارجة عن السيطرة المعقولة. قد تؤدي التأخيرات الناتجة عن العميل إلى رسوم إضافية قابلة للتطبيق."],
  },
  {
    en: ["PERSONAL BELONGINGS", "Customers must remove valuables, cash, documents and personal belongings before handing over the vehicle. Primex is not responsible for loss/damage to belongings left inside, except where liability cannot legally be excluded."],
    ar: ["المتعلقات الشخصية", "يجب على العملاء إزالة الأشياء الثمينة، والنقدية، والمستندات، والمتعلقات الشخصية قبل تسليم المركبة. شركة برايمكس غير مسؤولة عن الفقدان/الضرر الذي يلحق بالمقتنيات المتروكة بالداخل، باستثناء الحالات التي لا يمكن فيها استبعاد المسؤولية قانونياً."],
  },
  {
    en: ["PAYMENT & CUSTOMER APPROVAL", "The customer's signature on the Job Card, quotation or invoice confirms approval of the stated services and charges. Approved additional services, materials and applicable parking/storage or other charges are payable by the customer."],
    ar: ["الدفع وموافقة العميل", "يشكل توقيع العميل على بطاقة العمل، أو عرض السعر، أو الفاتورة موافقة على الخدمات المحددة والرسوم. تُحتسب الخدمات الإضافية المعتمدة، والمواد، ورسوم الركن/التخزين القابلة للتطبيق، أو الرسوم الأخرى على العميل."],
  },
  {
    en: ["VEHICLE DOCUMENTS & INSURANCE", "The customer is responsible for valid registration, insurance and legally required documents, and must inform Primex of any relevant lease, finance, insurance or other restriction."],
    ar: ["مستندات المركبة والتأمين", "العميل مسؤول عن التسجيل الساري، والتأمين، وجميع المستندات المطلوبة قانونياً، ويجب عليه إبلاغ شركة برايمكس بأي عقد إيجار، أو تمويل، أو تأمين، أو أي قيود أخرى ذات صلة."],
  },
  {
    en: ["SERVICE WARRANTY / GUARANTEE", "Any Primex or manufacturer warranty/guarantee applies only to the specific service/product and period stated in the applicable quotation, invoice, warranty document or aftercare instructions. It does not cover accidents, misuse, improper maintenance, chemicals, contamination, modifications, normal wear, third-party work or failure to follow aftercare. Mandatory legal rights are not excluded."],
    ar: ["ضمان الخدمة / الضمان", "ينطبق أي ضمان من شركة برايمكس أو ضمان الشركة المُصنعة فقط على المنتج/الخدمة المحددة والفترة المذكورة في عرض السعر المعمول به، أو الفاتورة، أو مستند الضمان، أو تعليمات ما بعد الخدمة. ولا يغطي الحوادث، أو سوء الاستخدام، أو الصيانة غير السليمة، أو المواد الكيميائية، أو التلوث، أو التعديلات، أو التآكل الطبيعي، أو عمل طرف ثالث، أو الفشل في اتباع إرشادات ما بعد الخدمة. لا تُستبعد الحقوق القانونية الإلزامية."],
  },
  {
    en: ["RESPONSIBILITY & LIMITATION OF LIABILITY", "Primex will exercise reasonable care. To the extent permitted by law, Primex is not responsible for loss/damage arising from pre-existing defects, concealed conditions, undisclosed repainting/repairs, customer-supplied materials, unauthorized modifications, normal wear and tear or events beyond reasonable control. Nothing excludes liability that cannot legally be excluded under Qatar law."],
    ar: ["المسؤولية وحدود المسؤولية", "ستمارس شركة برايمكس العناية المعقولة. وفي حدود ما يسمح به القانون، لا تتحمل شركة برايمكس المسؤولية عن الفقدان/الضرر الناشئ عن العيوب الموجودة مسبقاً، أو الظروف المخفية، أو الإصلاحات/التصليحات غير المفصح عنها، أو المواد المقدمة من العميل، أو التعديلات غير المصرح بها، أو التآكل الطبيعي، أو أي أحداث خارجة عن السيطرة المعقولة. لا شيء يستبعد المسؤولية التي لا يمكن استبعادها قانونياً بموجب قانون قطر."],
  },
  {
    en: ["PHOTOGRAPHS & VIDEO RECORDS", "Primex may take photographs/videos before, during and after service for vehicle-condition records, service documentation, quality control, warranty/service records and protection of both parties in the event of a dispute. Personal data will be handled in accordance with applicable Qatar requirements."],
    ar: ["التصوير الفوتوغرافي وتسجيلات الفيديو", "قد تأخذ شركة برايمكس صوراً/مقاطع فيديو قبل وأثناء وبعد الخدمة لسجلات حالة المركبة، وتوثيق الخدمة، وضبط الجودة، وسجلات الضمان/الخدمة، وحماية كلا الطرفين في حال وجود نزاع. سيتم التعامل مع البيانات الشخصية وفقاً لمتطلبات قانون حماية البيانات القطري المعمول به."],
  },
  {
    en: ["CUSTOMER ACKNOWLEDGEMENT", "By signing the front side of this Job Card, the customer confirms that these Terms & Conditions have been made available, read, understood and accepted and form part of the Job Card, quotation and/or invoice."],
    ar: ["إقرار العميل", "بالتوقيع على الوجه الأمامي لبطاقة العمل هذه، يقر العميل بأن هذه الشروط والأحكام قد تم إتاحتها له، وقراءتها، وفهمها، وقبولها، وتشكل جزءاً من بطاقة العمل، وعرض السعر، و/أو الفاتورة."],
  },
  {
    en: ["GOVERNING LAW & JURISDICTION", "These Terms & Conditions and any contract formed hereunder shall be governed by and construed in accordance with the laws of the State of Qatar. Any disputes arising out of or in connection with these Terms or the services provided shall be subject to the exclusive jurisdiction of the Qatari courts."],
    ar: ["القانون الحاكم والاختصاص القضائي", "تخضع هذه الشروط والأحكام وأي عقد يتشكل بموجبها وتفسر وفقاً لقوانين دولة قطر. يخضع أي نزاع ينشأ عن أو يتعلق بهذه الشروط أو الخدمات المقدمة للاختصاص القضائي الحصري لمحاكم قطر."],
  },
  {
    en: ["RIGHT OF LIEN & VEHICLE RETENTION", "Primex explicitly retains a strict right of lien and possessory right over the vehicle until all issued invoices, approved service fees, and accumulated storage charges are paid in full by the customer or their authorized representative."],
    ar: ["حق الحجز والاحتفاظ بالمركبة", "تحتفظ شركة برايمكس صراحةً بحق الحجز والاحتفاظ بالمركبة حتى يتم دفع جميع الفواتير الصادرة، ورسوم الخدمة المعتمدة، والمبالغ المتراكمة لرسوم التخزين بالكامل من قبل العميل أو ممثله المعتمد."],
  },
  {
    en: ["RIGHT TO HALT SERVICE & DEFECT DISCOVERY", "Primex reserves the right to immediately halt or suspend services if severe undisclosed damage, structural weakness, unsound previous repainting, or safety risks are discovered upon commencement of work. Primex will inform the customer promptly, and the customer shall remain liable for all labor, materials, and costs incurred up to the time-of-service suspension."],
    ar: ["الحق في إيقاف الخدمة واكتشاف العيوب", "تحتفظ شركة برايمكس بالحق في الإيقاف الفوري أو تعليق الخدمات إذا تم اكتشاف تلف شديد غير مفصح عنه، أو ضعف هيكلي، أو إصلاحات سابقة غير سليمة، أو مخاطر سلامة عند بدء العمل. ستقوم شركة برايمكس بإبلاغ العميل فوراً، ويظل العميل مسؤولاً عن جميع تكاليف العمالة والمواد المتكبدة حتى وقت تعليق الخدمة."],
  },
  {
    en: ["SEVERABILITY", "If any provision or part-provision of these Terms & Conditions is held to be invalid, illegal, or unenforceable under Qatar's Consumer Protection Law or other applicable legislation, that provision shall be deemed modified to the minimum extent necessary, and the validity and enforceability of the remaining provisions shall continue in full force and effect."],
    ar: ["قابلية الفصل", "إذا تم اعتبار أي حكم أو جزء من هذه الشروط والأحكام باطلاً، أو غير قانوني، أو غير قابل للتنفيذ بموجب قانون حماية المستهلك القطري أو أي تشريع آخر قابل للتطبيق، فسيُعد هذا الحكم معدلاً بالحد الأدنى الضروري، وتستمر صحة وقابلية تنفيذ الأحكام المتبقية بكامل قوتها وأثرها."],
  },
];

// Front-of-card labels (from the physical job card).
export const CONDITIONS = [
  ["scratches", "Scratches"],
  ["dents", "Dents"],
  ["interiorDamage", "Interior Damage"],
  ["wheelRimDamage", "Wheel / Rim Damage"],
  ["existingPpfVinyl", "Existing PPF / Vinyl"],
  ["glassDamage", "Glass Damage / Cracks"],
  ["paintDefects", "Paint Defects"],
] as const;

export const FUEL_LEVELS = ["E", "¼", "½", "¾", "F"] as const;

export const SHOP = {
  name: "PRIMEX Tinting & Protection Centre",
  mobile: "+974 5545 4570",
  address: "Ain Khalid, Salwa Road, Doha – Qatar",
  important:
    "IMPORTANT: By signing this Job Card, you confirm that you have read, understood and accepted the Terms & Conditions printed on the reverse side of this Job Card.",
  thanks: "Thank you for choosing PRIMEX Tinting & Protection Centre.",
  diagramHint: "Please mark (✓) on the diagram to indicate any existing scratches, dents or damages.",
};
