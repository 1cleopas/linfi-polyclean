/*
  LINFI POLYCLEAN — daily backup to Google Drive.

  Runs in your own Google account (script.google.com). Once a day it downloads a full copy of the
  jobs, workers, invoices and expenses from the website and saves it as a .json file in the Drive
  folder "LINFI Polyclean backups". Backups older than KEEP_DAYS go to the Drive bin.

  Setup (see BACKUP_SETUP.md):
  1. Project Settings → Script properties → add BACKUP_SECRET with the same value as on Render.
  2. Choose the function "setup" at the top and press Run. Allow the permissions it asks for.
*/

const SITE_URL = 'https://www.linfipolyclean.com'
const FOLDER_NAME = 'LINFI Polyclean backups'
const KEEP_DAYS = 90
const TIME_ZONE = 'Africa/Accra'

/** Run once: creates the folder, schedules the daily backup at about 2am, and makes the first backup. */
function setup() {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === 'backupNow') ScriptApp.deleteTrigger(trigger)
  }
  ScriptApp.newTrigger('backupNow').timeBased().everyDays(1).atHour(2).inTimezone(TIME_ZONE).create()
  backupNow()
}

/** Makes one backup now. Also what the daily schedule runs. */
function backupNow() {
  const secret = PropertiesService.getScriptProperties().getProperty('BACKUP_SECRET')
  if (!secret) throw new Error('Add BACKUP_SECRET under Project Settings → Script properties first.')

  const response = fetchBackup(secret)
  const data = JSON.parse(response.getContentText())
  const stamp = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HHmm')
  const name = `linfi-backup ${stamp}.json`
  const file = backupFolder().createFile(name, JSON.stringify(data, null, 2), 'application/json')
  console.log(
    `Saved ${name}: ${data.jobs.length} jobs, ${data.workers.length} workers, ` +
      `${data.invoices.length} invoices, ${data.expenses.length} expenses (${file.getSize()} bytes).`,
  )
  removeOldBackups()
}

function fetchBackup(secret) {
  const options = { headers: { 'x-backup-secret': secret }, muteHttpExceptions: true }
  let response = UrlFetchApp.fetch(`${SITE_URL}/api/backup`, options)
  // A sleeping server can fail the first request while it wakes up, so try once more.
  if (response.getResponseCode() !== 200) {
    Utilities.sleep(45000)
    response = UrlFetchApp.fetch(`${SITE_URL}/api/backup`, options)
  }
  if (response.getResponseCode() !== 200) {
    throw new Error(`Backup failed (${response.getResponseCode()}): ${response.getContentText().slice(0, 300)}`)
  }
  return response
}

function backupFolder() {
  const properties = PropertiesService.getScriptProperties()
  const savedId = properties.getProperty('FOLDER_ID')
  if (savedId) {
    try {
      const folder = DriveApp.getFolderById(savedId)
      if (!folder.isTrashed()) return folder
    } catch (error) {
      // The folder was deleted; make a new one below.
    }
  }
  const existing = DriveApp.getFoldersByName(FOLDER_NAME)
  const folder = existing.hasNext() ? existing.next() : DriveApp.createFolder(FOLDER_NAME)
  properties.setProperty('FOLDER_ID', folder.getId())
  return folder
}

function removeOldBackups() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
  const files = backupFolder().getFiles()
  while (files.hasNext()) {
    const file = files.next()
    if (file.getName().startsWith('linfi-backup ') && file.getDateCreated().getTime() < cutoff) {
      file.setTrashed(true)
    }
  }
}
