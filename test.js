/**
 * Creating launch agent for handling the deletion of
 * index data folder when app crashed or on boot up
 */
function initializeLaunchAgent() {
    let pidValue = process.pid;
    if (isMac) {
        createLaunchScript(pidValue, 'clear-data', searchConfig.LIBRARY_CONSTANTS.LAUNCH_AGENT_FILE, function (res) {
            if (!res) {
                log.send(logLevels.ERROR, `Launch Agent not created`);
            }
            createLaunchScript(null, 'clear-data-boot', searchConfig.LIBRARY_CONSTANTS.LAUNCH_DAEMON_FILE, function (result) {
                if (!result) {
                    log.send(logLevels.ERROR, `Launch Agent not created`);
                }
                launchDaemon(`${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/.symphony/clear-data-boot.sh`, function (data) {
                    if (data) {
                        log.send(logLevels.INFO, 'Launch Daemon: Creating successful');
                    }
                });
            });

            launchAgent(pidValue, `${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/.symphony/clear-data.sh`, function (response) {
                if (response) {
                    log.send(logLevels.INFO, 'Launch Agent: Creating successful');
                }
            });
        });
    } else {
        let folderPath = isDevEnv ? path.join(__dirname, '..', '..', searchConfig.FOLDERS_CONSTANTS.INDEX_FOLDER_NAME) :
            path.join(searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH, searchConfig.FOLDERS_CONSTANTS.INDEX_FOLDER_NAME);
        taskScheduler(`${searchConfig.LIBRARY_CONSTANTS.WINDOWS_TASK_FILE}`, folderPath, pidValue, `${searchConfig.LIBRARY_CONSTANTS.WINDOWS_CLEAR_SCRIPT}`);
    }
}

/**
 * Passing the pid of the application and creating the
 * bash file in the userData folder
 * @param pid
 * @param name
 * @param scriptPath
 * @param cb
 */
function createLaunchScript(pid, name, scriptPath, cb) {

    if (!fs.existsSync(`${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/.symphony/`)) {
        fs.mkdirSync(`${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/.symphony/`);
    }

    fs.readFile(scriptPath, 'utf8', function (err, data) {
        if (err) {
            log.send(logLevels.ERROR, `Error reading sh file: ${err}`);
            cb(false);
            return;
        }
        let result = data;
        result = result.replace(/dataPath/g, `"${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/${searchConfig.FOLDERS_CONSTANTS.INDEX_FOLDER_NAME}"`);
        result = result.replace(/scriptPath/g, `${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/.symphony/${name}.sh`);
        if (pid) {
            result = result.replace(/SymphonyPID/g, `${pid}`);
        }

        fs.writeFile(`${searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH}/.symphony/${name}.sh`, result, 'utf8', function (error) {
            if (error) {
                log.send(logLevels.ERROR, `Error writing sh file: ${error}`);
                return cb(false);
            }
            return cb(true);
        });
    });
}
