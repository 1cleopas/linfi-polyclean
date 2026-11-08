# Daily backups to Google Drive

Every day at about 2am (Ghana time) a small script in your Google account downloads a full copy of the
jobs, workers, invoices and expenses and saves it in the Drive folder **LINFI Polyclean backups**.
Each backup is one `.json` file named with its date. Backups older than 90 days go to the Drive bin.

The backup holds customer names, phone numbers and addresses, so keep the folder private (do not share it).

## 1. Add the backup secret on Render (once)

1. Make a long random secret, for example by running `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
2. In the Render dashboard, open **linfi-polyclean-live → Environment**.
3. Add `BACKUP_SECRET` with that value and save. Render restarts the site.

## 2. Create the script in Google (once, about 5 minutes)

1. Sign in to Google with the account whose Drive should hold the backups, and open https://script.google.com.
2. Click **New project**. Rename it (top left) to `LINFI backups`.
3. Delete everything in `Code.gs` and paste in the whole of `integrations/google-drive-backup.gs`. Press **Save**.
4. Click **Project Settings** (gear icon) → **Script properties** → **Add script property**.
   Property: `BACKUP_SECRET`, value: the same secret as on Render. Click **Save script properties**.
5. Go back to **Editor**, choose `setup` in the function list at the top, and press **Run**.
6. Google asks for permission. Click **Review permissions**, choose your account, then **Allow**.
   (If it says the app isn't verified, click **Advanced → Go to LINFI backups**. It is your own script.)
7. The log at the bottom should say `Saved linfi-backup ….json`. The folder now appears in your Drive.

## Checking and restoring

- Open **LINFI Polyclean backups** in Google Drive to see the daily files.
- If a daily run fails, Google emails you about it.
- To make an extra backup at any time, open the script, choose `backupNow` and press **Run**.
- To restore after a loss, keep the newest good file and ask a developer to load it back.
