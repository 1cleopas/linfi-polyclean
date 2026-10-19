# Turning on booking alerts and confirmations

The website code is live, and these settings are already on Render:

| Setting | Value |
| --- | --- |
| `ALERT_EMAILS` | info@linfipolyclean.com |
| `ALERT_PHONES` | 0599842689 |
| `EMAIL_FROM` | LINFI POLYCLEAN <bookings@linfipolyclean.com> |
| `SMS_SENDER_ID` | LINFI |

Nothing is sent until you add the two API keys below. Bookings keep working either way.

## 1. Email (Resend), about 15 minutes plus DNS time

1. Sign up at https://resend.com (the free plan covers 3,000 emails a month).
2. Go to **Domains → Add domain** and enter `linfipolyclean.com`.
3. Resend shows a few DNS records (TXT and MX). Add them where the domain is managed (the registrar or DNS host), then click **Verify** in Resend. This can take from a few minutes to a few hours.
4. Go to **API Keys → Create API key**, with **Sending access** only. Copy the key; it starts with `re_`.
5. Check that the inbox `info@linfipolyclean.com` actually receives mail, because alerts go there. To use another address, change `ALERT_EMAILS` in Render; separate several addresses with commas.

## 2. SMS (Arkesel), about 10 minutes plus sender ID approval

1. Sign up at https://arkesel.com and top up a small amount of SMS credit.
2. Under **Sender IDs**, request `LINFI`. Networks must approve it, which usually takes a day or two. To use a different name (11 characters at most), change `SMS_SENDER_ID` in Render to match.
3. Under **Settings → API Keys** (or **Developers**), copy your API key.

## 3. Add the keys in Render

1. Open https://dashboard.render.com/web/srv-db1cf01srm7s73b22830 and go to **Environment**.
2. Add `RESEND_API_KEY` with the Resend key.
3. Add `ARKESEL_API_KEY` with the Arkesel key.
4. Save. Render redeploys by itself.
5. Under **Logs**, look for a line like:
   `Booking notifications: email on, SMS on, manager alerts to 1 email(s) and 1 phone(s), customer confirmations on`

## 4. Test it

1. Before the sender ID is approved, you can add `SMS_SANDBOX` = `1` in Render. Arkesel then accepts the message without delivering it, which proves the key works.
2. Make one booking on the live site with your own phone number and email address.
3. You should get the manager alert (email and SMS) and the customer confirmation (SMS and email).
4. If something doesn't arrive, look in the Render **Logs** for `Booking notification failed:`. The line includes the provider's error message.
5. Remove `SMS_SANDBOX` once real SMS should go out, then delete your test booking from the dashboard.

## Other switches

- `CUSTOMER_CONFIRMATIONS` = `off` stops messages to customers but keeps your alerts.
- `NOTIFY_DRY_RUN` = `1` writes messages to the logs instead of sending them.
