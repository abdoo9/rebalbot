start_command = 
    .description = Start the bot
language_command = 
    .description = Change language
setcommands_command =
    .description = Set bot commands

welcome = 
    .text = هلا بك في بوت ريبال لتحويل العملات الرجاء اختيار العملة التي تريد التحويل منها
    .choose-currency = اختر العملة
    .add-contact = يرجى اضافة معلومات الاتصال الخاصة بك للاستمرار
    .add-contact-button = اضافة معلومات الاتصال
    .contact-saved = تم تحديث معلوماتك يمكنك الان استخدام البوت اضغط /start
language = 
    .select = الرجاء اختيار اللغة
    .changed = تم تغيير اللغة الى العربية
admin =
    .commands-updated = Commands updated.
unhandled = امر غير معروف /start

currency = 
    .from = من العملة:
    .to = الى العملة:

request = 
    .text = من عملة: {$fromCurrency}
        الى عملة: {$toCurrency}
        { $exchangeRate ->
            [not-provided] ​
           *[other] سعر الصرف : { $exchangeRate }
        }
        الكمية: {$amount}
        { $fromWallet ->
            [not-provided] ​
           *[other] المحفظة التي سيتم التحويل منها: { $fromWallet }
        }
    .choose-to-currency = اختر العملة التي تريد استلامها
    .choose-from-currency = اختر العملة التي تريد ارسالها
    .amount-required = قم بارسال مبلغ ال({$fromCurrency}) الذي تريد تحويله
    .from-wallet-required = قم بارسال معلومات محفظة ال({$fromCurrency}) التي سيتم التحويل منها
    .submit = تاكيد طلب التحويل
    .cancel = الغاء الطلب

admins-group =
    .submited-request-text = { request.text }
currencies =
    .zainCash = زين كاش
    .payeer = باير
    .perfectMoney = بيرفكت موني
    .usdt = يو اس دي تي
    .bitcoin = بيتكوين