start_command = 
    .description = Start the bot
language_command = 
    .description = Change language
setcommands_command =
    .description = Set bot commands

welcome = 
    .text = هلا بك في بوت Rebal.online ريبال لتحويل العملات الرجاء اختيار العملة التي تريد التحويل منها
    /rate - اضغط هنا للحصول على سعر الصرف
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
        المبلغ المرسل: {$amount}
        { $finalAmount ->
            [not-provided] ​
           *[other] المبلغ المستلم: <code>{ $finalAmount }</code>
        }
        { $userReceivingWallet ->
            [not-provided] ​
           *[other]محفظة الاستلام الخاصة بك: <code>{ $userReceivingWallet }</code>
        }
        { $transactionId ->
            [not-provided] ​
           *[other]رقم العملية: <code>{ $transactionId }</code>
        }
    .choose-to-currency = اختر العملة التي تريد استلامها
    .choose-from-currency = اختر العملة التي تريد ارسالها
    .amount-required =<b> قم بارسال مبلغ ال({$fromCurrency}) الذي تريد تحويله</b>
    .user-receiving-wallet-required =قم بارسال محفظة ال({$toCurrency}) التي تريد استلام المبلغ عليها
    .photo-required = {request.text}
        <b>يرجى ارسال صورة اثبات التحويل</b>
    .please-send-money-to-admin-wallet = {request.text} <b>قم بالتحويل الى المحفظة التالية</b> <code>{ $adminWallet }</code>
         <b>ثم قم بارسال رقم العملية او باش او txid</b>
    .submit = تاكيد الدفع
    .cancel = الغاء الطلب
    .submited = تم رفع طلبك بنجاح يرجى انتظار لبضع دقائق لمراجعة الطلب الخاص بكم
    .submited-request-text = رقم الطلب:<code> { $requestId }</code>
         { request.text }
         محفظة الادمن: <code>{ $adminWallet }</code>
    .already-submited = { request.submited }
    .request-approved = تم الموافقة على الطلب
        #{ $requestId }
    .request-rejected = تم رفض الطلب
        #{ $requestId }
    .approve = الموافقة
    .reject = الرفض
    .error = حدث خطأ  /start
    .admin-confirm-receipt = تم تأكيد الاستلام
    .wait-for-previous-request = لا يمكنك ارسال طلب جديد حتى يتم مراجعة الطلب السابق { $requestId }
admins-group =
    .submited-request-text = رقم الطلب:#{ $requestId }
         معرف العميل: @{ $username }
         ايدي العميل: { $userId }
         اسم العميل: <a href="tg://user?id={ $userId }">{ $name }</a>
         { request.text }
         محفظة الادمن: <code>{ $adminWallet }</code>
         رابط الدردشة: { $topicLink}
prevent-making-request=
    .message = لا يمكنك ارسال طلب جديد حتى يتم مراجعة الطلب السابق { $requestId }
    .title = لا يمكنك ارسال طلب جديد حتى يتم مراجعة الطلب السابق { $requestId }