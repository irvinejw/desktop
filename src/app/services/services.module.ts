import { webFrame } from 'electron';

import {
    APP_INITIALIZER,
    NgModule,
} from '@angular/core';

import { ToasterModule } from 'angular2-toaster';

import { isDev } from '../../scripts/utils';

import { DesktopPlatformUtilsService } from '../../services/desktopPlatformUtils.service';
import { DesktopRendererMessagingService } from '../../services/desktopRendererMessaging.service';
import { DesktopRendererSecureStorageService } from '../../services/desktopRendererSecureStorage.service';
import { DesktopStorageService } from '../../services/desktopStorage.service';
import { I18nService } from '../../services/i18n.service';

import { AuthGuardService } from './auth-guard.service';
import { BroadcasterService } from './broadcaster.service';
import { ValidationService } from './validation.service';

import { Analytics } from 'jslib/misc/analytics';

import {
    ApiService,
    AppIdService,
    AuthService,
    CipherService,
    CollectionService,
    ConstantsService,
    ContainerService,
    CryptoService,
    EnvironmentService,
    FolderService,
    LockService,
    PasswordGenerationService,
    SettingsService,
    StateService,
    SyncService,
    TokenService,
    TotpService,
    UserService,
    UtilsService,
} from 'jslib/services';

import {
    ApiService as ApiServiceAbstraction,
    AppIdService as AppIdServiceAbstraction,
    AuthService as AuthServiceAbstraction,
    CipherService as CipherServiceAbstraction,
    CollectionService as CollectionServiceAbstraction,
    CryptoService as CryptoServiceAbstraction,
    EnvironmentService as EnvironmentServiceAbstraction,
    FolderService as FolderServiceAbstraction,
    I18nService as I18nServiceAbstraction,
    LockService as LockServiceAbstraction,
    MessagingService as MessagingServiceAbstraction,
    PasswordGenerationService as PasswordGenerationServiceAbstraction,
    PlatformUtilsService as PlatformUtilsServiceAbstraction,
    SettingsService as SettingsServiceAbstraction,
    StateService as StateServiceAbstraction,
    StorageService as StorageServiceAbstraction,
    SyncService as SyncServiceAbstraction,
    TokenService as TokenServiceAbstraction,
    TotpService as TotpServiceAbstraction,
    UserService as UserServiceAbstraction,
    UtilsService as UtilsServiceAbstraction,
} from 'jslib/abstractions';

webFrame.registerURLSchemeAsPrivileged('file');

const i18nService = new I18nService(window.navigator.language, './locales');
const utilsService = new UtilsService();
const stateService = new StateService();
const platformUtilsService = new DesktopPlatformUtilsService(i18nService);
const broadcasterService = new BroadcasterService();
const messagingService = new DesktopRendererMessagingService(broadcasterService);
const storageService: StorageServiceAbstraction = new DesktopStorageService();
const secureStorageService: StorageServiceAbstraction = new DesktopRendererSecureStorageService();
const constantsService = new ConstantsService({}, 0);
const cryptoService = new CryptoService(storageService, secureStorageService);
const tokenService = new TokenService(storageService);
const appIdService = new AppIdService(storageService);
const apiService = new ApiService(tokenService, platformUtilsService,
    (expired: boolean) => messagingService.send('logout', { expired: expired }));
const environmentService = new EnvironmentService(apiService, storageService);
const userService = new UserService(tokenService, storageService);
const settingsService = new SettingsService(userService, storageService);
const cipherService = new CipherService(cryptoService, userService, settingsService,
    apiService, storageService, i18nService);
const folderService = new FolderService(cryptoService, userService,
    () => i18nService.t('noneFolder'), apiService, storageService, i18nService);
const collectionService = new CollectionService(cryptoService, userService, storageService, i18nService);
const lockService = new LockService(cipherService, folderService, collectionService,
    cryptoService, platformUtilsService, storageService, messagingService);
const syncService = new SyncService(userService, apiService, settingsService,
    folderService, cipherService, cryptoService, collectionService,
    storageService, messagingService, (expired: boolean) => messagingService.send('logout', { expired: expired }));
const passwordGenerationService = new PasswordGenerationService(cryptoService, storageService);
const totpService = new TotpService(storageService);
const containerService = new ContainerService(cryptoService, platformUtilsService);
const authService = new AuthService(cryptoService, apiService,
    userService, tokenService, appIdService, i18nService, platformUtilsService, constantsService,
    messagingService);

const analytics = new Analytics(window, () => isDev(), platformUtilsService, storageService, appIdService);
containerService.attachToWindow(window);
environmentService.setUrlsFromStorage().then(() => {
    return syncService.fullSync(true);
});

function initFactory(): Function {
    return async () => {
        await i18nService.init();
        await authService.init();
        const htmlEl = window.document.documentElement;
        htmlEl.classList.add('os_' + platformUtilsService.getDeviceString());
        htmlEl.classList.add('locale_' + i18nService.translationLocale);
        stateService.save(ConstantsService.disableFaviconKey,
            await storageService.get<boolean>(ConstantsService.disableFaviconKey));

        let installAction = null;
        const installedVersion = await storageService.get<string>(ConstantsService.installedVersionKey);
        const currentVersion = platformUtilsService.getApplicationVersion();
        if (installedVersion == null) {
            installAction = 'install';
        } else if (installedVersion !== currentVersion) {
            installAction = 'update';
        }

        if (installAction != null) {
            await storageService.save(ConstantsService.installedVersionKey, currentVersion);
            analytics.ga('send', {
                hitType: 'event',
                eventAction: installAction,
            });
        }
    };
}

@NgModule({
    imports: [
        ToasterModule,
    ],
    declarations: [],
    providers: [
        ValidationService,
        AuthGuardService,
        { provide: AuthServiceAbstraction, useValue: authService },
        { provide: CipherServiceAbstraction, useValue: cipherService },
        { provide: FolderServiceAbstraction, useValue: folderService },
        { provide: CollectionServiceAbstraction, useValue: collectionService },
        { provide: EnvironmentServiceAbstraction, useValue: environmentService },
        { provide: TotpServiceAbstraction, useValue: totpService },
        { provide: TokenServiceAbstraction, useValue: tokenService },
        { provide: I18nServiceAbstraction, useValue: i18nService },
        { provide: UtilsServiceAbstraction, useValue: utilsService },
        { provide: CryptoServiceAbstraction, useValue: cryptoService },
        { provide: PlatformUtilsServiceAbstraction, useValue: platformUtilsService },
        { provide: PasswordGenerationServiceAbstraction, useValue: passwordGenerationService },
        { provide: ApiServiceAbstraction, useValue: apiService },
        { provide: SyncServiceAbstraction, useValue: syncService },
        { provide: UserServiceAbstraction, useValue: userService },
        { provide: MessagingServiceAbstraction, useValue: messagingService },
        { provide: BroadcasterService, useValue: broadcasterService },
        { provide: SettingsServiceAbstraction, useValue: settingsService },
        { provide: LockServiceAbstraction, useValue: lockService },
        { provide: StorageServiceAbstraction, useValue: storageService },
        { provide: StateServiceAbstraction, useValue: stateService },
        {
            provide: APP_INITIALIZER,
            useFactory: initFactory,
            deps: [],
            multi: true,
        },
    ],
})
export class ServicesModule {
}
