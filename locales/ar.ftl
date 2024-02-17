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
        { $rate ->
            [not-provided] ​
           *[other] سعر الصرف : { $rate }
        }
        { $fee ->
            [not-provided] ​
           *[other] العمولة: { $fee }
        }
        { $finalAmount ->
            [not-provided] ​
           *[other]المبلغ الذي تستلمه: <code>{ $finalAmount }</code>
        }
        المبلغ الذي ترسله: {$amount}
        { $userReceivingWallet ->
            [not-provided] ​
           *[other] المحفظة التي تريد الاستلام عليها: <code>{ $userReceivingWallet }</code>
        }
        { $fromWallet ->
            [not-provided] ​
           *[other] المحفظة التي سيتم التحويل منها: <code>{ $fromWallet }</code>
        }
        { $transactionId ->
            [not-provided] ​
           *[other]رقم العملية: <code>{ $transactionId }</code>
        }
    .choose-to-currency = اختر العملة التي تريد استلامها
    .choose-from-currency = اختر العملة التي تريد ارسالها
    .amount-required =<b> قم بارسال مبلغ ال({$fromCurrency}) الذي تريد تحويله</b>
    .from-wallet-required =<b>قم بارسال معلومات محفظة ال({$fromCurrency}) التي سيتم التحويل منها</b>
    .user-receiving-wallet-required =قم بارسال محفظة ال({$toCurrency}) التي تريد استلام المبلغ عليها
    .photo-required = {request.text}
        <b>يرجى ارسال صورة اثبات التحويل</b>
    .transaction-id-required = {request.text} <b>قم بالتحويل الى المحفظة التالية</b> <code>{ $adminWallet }</code>
         <b>ثم قم بارسال رقم العملية</b>
    .submit = تاكيد طلب التحويل
    .cancel = الغاء الطلب
    .submited = تم رفع طلبك بنجاح يرجى انتظار لبضع دقائق لمراجعة الطلب الخاص بكم
    .submited-request-text = رقم الطلب:<code> { $requestId }</code>
         { request.text }
         محفظة الادمن: <code>{ $adminWallet }</code>
    .already-submited = { request.submited }

admins-group =
    .submited-request-text = رقم الطلب:<code> { $requestId }</code>
         { request.text }
         محفظة الادمن: <code>{ $adminWallet }</code>
