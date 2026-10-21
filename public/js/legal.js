const operator = `Johannes Jamroszczyk
c/o IP-Management #11378
Ludwig-Erhard-Straße 18
20459 Hamburg`;

function shell(title, body) {
  return `
    <main class="legal">
      <p class="legal-kicker"><a href="#/">Books</a></p>
      <h1>${title}</h1>
      ${body}
    </main>
  `;
}

export function imprintPage() {
  return shell(
    "Impressum",
    `
      <h2>Inhalte gemäß § 5 DDG</h2>
      <p class="address">${operator}</p>
      <h2>Kontaktdaten</h2>
      <p>E-Mail: <a href="mailto:jojojatt@yahoo.de">jojojatt@yahoo.de</a><br />Telefon: 0176 63319606</p>
      <p class="legal-source">Quelle: Impressum-Privatschutz</p>
    `
  );
}

const privacy = {
  de: {
    title: "Datenschutzerklärung",
    note: "Rechtlich maßgeblich ist die deutsche Fassung.",
    source:
      "Quelle der Basistexte: e-recht24.de. Die Abschnitte wurden an den tatsächlichen Betrieb dieser Website angepasst (Book Assistant, Hosting bei Render, Manuskripte im Browser, Google Fonts, keine eigenen Cookies, kein Tracking).",
    html: `
      <h2>1. Datenschutz auf einen Blick</h2>
      <h3>Allgemeine Hinweise</h3>
      <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.</p>
      <h3>Datenerfassung auf dieser Website</h3>
      <p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.</p>
      <p><strong>Wie erfassen wir Ihre Daten?</strong><br />Book Assistant ist ein Schreibwerkzeug für Bücher. Es gibt kein Kontaktformular, kein Nutzerkonto und keine Bestellfunktion. Sie müssen uns keine personenbezogenen Daten mitteilen, um die Seite zu nutzen.</p>
      <p>Texte, Kapitel, Bucheinstellungen, Schreibfortschritt und Titelbilder, die Sie in der Anwendung anlegen, werden in Ihrem Browser gespeichert (IndexedDB). Diese Inhalte werden nicht an den Betreiber übertragen. Export und Import erzeugen bzw. lesen eine Datei auf Ihrem Gerät; auch dabei wird nichts an uns hochgeladen.</p>
      <p>Technische Daten können automatisch beim Besuch der Website durch die IT-Systeme des Hosters erfasst werden. Das sind vor allem Server-Logs (z. B. IP-Adresse, Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.</p>
      <p>Beim Laden der Seite ruft Ihr Browser außerdem Schriftarten von Google Fonts ab. Dabei kann eine Verbindung zu Servern von Google entstehen. Einzelheiten stehen im Abschnitt „Schriftarten“.</p>
      <p><strong>Wofür nutzen wir Ihre Daten?</strong><br />Die automatisch erhobenen technischen Daten dienen ausschließlich der sicheren und fehlerfreien Bereitstellung der Website. Wir führen keine Reichweitenanalyse durch und nutzen Ihre Daten nicht für Werbung. Den Text Ihrer Bücher erhalten und verwenden wir nicht.</p>
      <p><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</p>
      <p>Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.</p>

      <h2>2. Hosting</h2>
      <h3>Externes Hosting</h3>
      <p>Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich vor allem um IP-Adressen, Meta- und Kommunikationsdaten, Websitezugriffe und sonstige Daten handeln, die über eine Website generiert werden. Die Manuskripte selbst liegen nicht auf diesen Servern, sondern im Browser der nutzenden Person.</p>
      <p>Das externe Hosting erfolgt im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).</p>
      <p>Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner Leistungspflichten erforderlich ist, und unsere Weisungen in Bezug auf diese Daten befolgen.</p>
      <p>Wir setzen folgenden Hoster ein:</p>
      <p class="address">Render Services, Inc.
525 Brannan Street Ste 300
San Francisco CA 94107
USA
Telefon: 415-319-8186
E-Mail: legal@render.com</p>
      <h3>Auftragsverarbeitung</h3>
      <p>Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.</p>

      <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
      <h3>Datenschutz</h3>
      <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
      <p>Wenn Sie diese Website benutzen, können verschiedene personenbezogene Daten erhoben werden. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.</p>
      <p>Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.</p>
      <h3>Hinweis zur verantwortlichen Stelle</h3>
      <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
      <p class="address">${operator}</p>
      <p>Telefon: +49 176 63319606<br />E-Mail: <a href="mailto:jojojatt@yahoo.de">jojojatt@yahoo.de</a></p>
      <p>Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.</p>
      <h3>Speicherdauer</h3>
      <p>Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.</p>
      <p>Server-Logs des Hosters unterliegen dessen üblichen Löschfristen. Bücher, Kapitel und die zugehörigen Einstellungen bleiben im Speicher Ihres Browsers, bis Sie das Buch löschen, die Website-Daten dieser Seite im Browser entfernen oder den Speicher des Browsers leeren. Der Betreiber speichert diese Inhalte nicht.</p>
      <h3>Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</h3>
      <p>Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind, auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser Datenschutzerklärung informiert.</p>
      <h3>Datenschutzbeauftragter</h3>
      <p>Wir haben einen Datenschutzbeauftragten benannt.</p>
      <p class="address">${operator}</p>
      <p>Telefon: +49 176 63319606<br />E-Mail: <a href="mailto:jojojatt@yahoo.de">jojojatt@yahoo.de</a></p>
      <h3>Empfänger von personenbezogenen Daten</h3>
      <p>Im Rahmen des Betriebs dieser Website arbeiten wir mit dem oben genannten Hoster zusammen. Eine Übermittlung von personenbezogenen Daten (insbesondere IP-Adressen in Server-Logs) an diesen Auftragsverarbeiter ist zur Bereitstellung der Website erforderlich. Beim Laden der Schriftarten kann außerdem eine Verbindung zu Google entstehen. Wir geben personenbezogene Daten nicht zu Werbe- oder Analysezwecken an Dritte weiter.</p>
      <p>Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung weiter.</p>
      <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
      <p>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>
      <h3>Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
      <p>Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling. Die jeweilige Rechtsgrundlage, auf der eine Verarbeitung beruht, entnehmen Sie dieser Datenschutzerklärung. Wenn Sie Widerspruch einlegen, werden wir Ihre betroffenen personenbezogenen Daten nicht mehr verarbeiten, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen oder die Verarbeitung der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen dient (Widerspruch nach Art. 21 Abs. 1 DSGVO).</p>
      <p>Werden Ihre personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, so haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung Sie betreffender personenbezogener Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Wenn Sie widersprechen, werden Ihre personenbezogenen Daten anschließend nicht mehr zum Zwecke der Direktwerbung verwendet (Widerspruch nach Art. 21 Abs. 2 DSGVO).</p>
      <p>Auf dieser Website betreiben wir keine Direktwerbung und kein Tracking.</p>
      <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
      <p>Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.</p>
      <p>Zuständige Aufsichtsbehörde für Hamburg ist der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit.</p>
      <h3>Recht auf Datenübertragbarkeit</h3>
      <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist. Die in Ihrem Browser gespeicherten Bücher können Sie außerdem selbst über die Export-Funktion als Datei herunterladen.</p>
      <h3>Auskunft, Berichtigung und Löschung</h3>
      <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und gegebenenfalls ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.</p>
      <h3>Recht auf Einschränkung der Verarbeitung</h3>
      <p>Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:</p>
      <ul>
        <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
        <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah oder geschieht, können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.</li>
        <li>Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
        <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
      </ul>
      <p>Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.</p>
      <h3>SSL- bzw. TLS-Verschlüsselung</h3>
      <p>Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.</p>
      <p>Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.</p>

      <h2>4. Datenerfassung auf dieser Website</h2>
      <h3>Server-Logs</h3>
      <p>Der Hoster dieser Website erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies können insbesondere sein:</p>
      <ul>
        <li>Browsertyp und Browserversion</li>
        <li>verwendetes Betriebssystem</li>
        <li>Referrer URL</li>
        <li>Hostname des zugreifenden Rechners</li>
        <li>Uhrzeit der Serveranfrage</li>
        <li>IP-Adresse</li>
      </ul>
      <p>Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Sicherheit seiner Website – hierzu müssen die Server-Logs erfasst werden.</p>
      <h3>Cookies</h3>
      <p>Diese Website setzt selbst keine Cookies. Insbesondere setzen wir keine Analyse-, Werbe- oder Tracking-Cookies ein. Ein Cookie-Banner ist daher für eigene Cookies nicht erforderlich.</p>
      <h3>Speicherung im Browser</h3>
      <p>Bücher, Kapitel, Manuskripttext, Bucheinstellungen, der Schreibfortschritt, Titelbilder und einzelne Anzeigeeinstellungen (etwa die eingeklappte Seitenleiste und der Hinweis, dass die Daten im Browser liegen) werden in der IndexedDB Ihres Browsers gespeichert. Diese Speicherung ist erforderlich, damit das von Ihnen genutzte Schreibwerkzeug Ihren Text auf diesem Gerät behält. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO in Verbindung mit § 25 Abs. 2 Nr. 2 TDDDG, weil die Speicherung der von Ihnen gewünschten Nutzung der Website dient.</p>
      <p>Der Eintrag entsteht, sobald Sie die Website nutzen und ein Buch anlegen oder öffnen. Sie können einzelne Bücher in der Anwendung löschen. Den gesamten Speicher dieser Website können Sie in den Einstellungen Ihres Browsers löschen. Es werden keine Local-Storage- oder Session-Storage-Einträge zu Analyse- oder Werbezwecken gesetzt.</p>
      <h3>Schriftarten</h3>
      <p>Diese Website lädt die Schriftarten Outfit, Literata und Noto Sans Mono über Google Fonts. Beim Aufruf der Seite stellt Ihr Browser eine Verbindung zu Servern von Google her (fonts.googleapis.com und fonts.gstatic.com). Dabei kann Google die IP-Adresse des abrufenden Geräts sowie technische Angaben zum Browser erfahren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist eine einheitliche Darstellung der Schreiboberfläche. Es findet darüber hinaus keine Auswertung Ihres Nutzungsverhaltens durch uns statt.</p>
      <h3>Keine Analyse-, Werbe- oder Social-Plugins</h3>
      <p>Wir binden keine Dienste wie YouTube, Google Analytics, Meta-Pixel oder vergleichbare Tracking-Werkzeuge ein. Es findet keine Auswertung Ihres Nutzungsverhaltens durch uns statt.</p>
    `,
  },
  en: {
    title: "Privacy policy",
    note: "The German version is the legally binding one.",
    source:
      "Source of the base text: e-recht24.de. The sections were adapted to how this website actually works (Book Assistant, hosting on Render, manuscripts stored in the browser, Google Fonts, no cookies set by the site, no tracking).",
    html: `
      <h2>1. Privacy at a glance</h2>
      <h3>General</h3>
      <p>The following notes give a simple overview of what happens to your personal data when you visit this website. Personal data is any data that can identify you personally. Detailed information is set out in the privacy policy below.</p>
      <h3>Data collected on this website</h3>
      <p><strong>Who is responsible for data collection on this website?</strong><br />Data processing on this website is carried out by the website operator. The operator’s contact details are in the section “Controller”.</p>
      <p><strong>How do we collect your data?</strong><br />Book Assistant is a tool for writing books. There is no contact form, no user account, and no ordering function. You do not have to give us personal data in order to use the site.</p>
      <p>Text, chapters, book settings, writing progress, and cover images you create in the app are stored in your browser (IndexedDB). That content is not sent to the operator. Export creates a file on your device, and import reads a file you choose. Neither action uploads the book to us.</p>
      <p>Technical data can be collected automatically when you visit the website, by the host’s systems. That is mainly server logs (for example IP address, browser, operating system, or the time of the request). This collection happens automatically as soon as you open the website.</p>
      <p>When the page loads, your browser also requests fonts from Google Fonts. That can open a connection to Google’s servers. Details are in the section “Fonts”.</p>
      <p><strong>What do we use your data for?</strong><br />Automatically collected technical data is used only to provide the website securely and without errors. We do not run audience analytics and we do not use your data for advertising. We do not receive or use the text of your books.</p>
      <p><strong>What rights do you have?</strong><br />You have the right to obtain, free of charge, information about the origin, recipients, and purpose of your stored personal data. You also have the right to request correction or erasure. If you have given consent, you can withdraw it at any time for the future. You may also have the right to request restriction of processing in certain circumstances. You have the right to lodge a complaint with the competent supervisory authority.</p>
      <p>You can contact us at any time about this or about other privacy questions.</p>

      <h2>2. Hosting</h2>
      <h3>External hosting</h3>
      <p>This website is hosted externally. Personal data collected on this website is stored on the host’s servers. That can include IP addresses, meta and communication data, visits, and other data generated by using a website. The manuscripts themselves are not stored on those servers. They stay in the user’s browser.</p>
      <p>External hosting is used so that the site can be provided securely, quickly, and efficiently by a professional provider (Art. 6 (1) (f) GDPR).</p>
      <p>The host processes your data only as far as needed to perform its services, and follows our instructions regarding that data.</p>
      <p>We use the following host:</p>
      <p class="address">Render Services, Inc.
525 Brannan Street Ste 300
San Francisco CA 94107
USA
Phone: 415-319-8186
Email: legal@render.com</p>
      <h3>Data processing agreement</h3>
      <p>We have concluded a data processing agreement for the service named above. This is the contract required by data protection law. It requires the processor to handle visitors’ personal data only on our instructions and in line with the GDPR.</p>

      <h2>3. General information and mandatory notices</h2>
      <h3>Privacy</h3>
      <p>The operators of these pages take the protection of your personal data seriously. We treat your personal data confidentially and in line with data protection law and this privacy policy.</p>
      <p>When you use this website, various personal data may be collected. Personal data is data that can identify you personally. This privacy policy explains which data we collect and why we use it. It also explains how and for what purpose that happens.</p>
      <p>Data transmission on the internet (for example by email) can have security gaps. Complete protection against access by third parties is not possible.</p>
      <h3>Controller</h3>
      <p>The controller for data processing on this website is:</p>
      <p class="address">${operator}</p>
      <p>Phone: +49 176 63319606<br />Email: <a href="mailto:jojojatt@yahoo.de">jojojatt@yahoo.de</a></p>
      <p>The controller is the natural or legal person who alone or jointly with others decides on the purposes and means of processing personal data (for example names, email addresses, and similar data).</p>
      <h3>Storage period</h3>
      <p>Unless a more specific storage period is stated in this privacy policy, your personal data remains with us until the purpose of processing no longer applies. If you make a legitimate request for erasure or withdraw consent, your data will be deleted unless we have another legally permitted reason to keep it (for example tax or commercial retention duties). In that case it is deleted after those reasons end.</p>
      <p>The host’s server logs follow the host’s usual deletion periods. Books, chapters, and their settings remain in your browser until you delete the book, clear this site’s data in the browser, or clear the browser’s storage. The operator does not store that content.</p>
      <h3>Legal bases</h3>
      <p>If you have consented, we process your personal data on the basis of Art. 6 (1) (a) GDPR. You can withdraw consent at any time. If your data is needed to perform a contract or to take steps before a contract, we process it on the basis of Art. 6 (1) (b) GDPR. If processing is needed to comply with a legal obligation, we process it on the basis of Art. 6 (1) (c) GDPR. Processing can also be based on our legitimate interest under Art. 6 (1) (f) GDPR. The specific basis for each case is stated in the following sections.</p>
      <h3>Data protection officer</h3>
      <p>We have appointed a data protection officer.</p>
      <p class="address">${operator}</p>
      <p>Phone: +49 176 63319606<br />Email: <a href="mailto:jojojatt@yahoo.de">jojojatt@yahoo.de</a></p>
      <h3>Recipients of personal data</h3>
      <p>To run this website we work with the host named above. Sending personal data to that processor (in particular IP addresses in server logs) is necessary to provide the website. Loading the fonts can also create a connection to Google. We do not pass personal data to third parties for advertising or analytics.</p>
      <p>Where we use processors, we pass on personal data only on the basis of a valid data processing agreement.</p>
      <h3>Withdrawing consent</h3>
      <p>Many processing operations are possible only with your express consent. You can withdraw consent that you have already given at any time. Withdrawal does not affect the lawfulness of processing that happened before the withdrawal.</p>
      <h3>Right to object in particular cases and to direct marketing (Art. 21 GDPR)</h3>
      <p>Where processing is based on Art. 6 (1) (e) or (f) GDPR, you have the right to object at any time, on grounds relating to your particular situation, to processing of your personal data. This also applies to profiling based on those provisions. The legal basis of a given processing operation is stated in this privacy policy. If you object, we will no longer process the personal data concerned unless we can demonstrate compelling legitimate grounds that override your interests, rights, and freedoms, or the processing is for the establishment, exercise, or defence of legal claims (objection under Art. 21 (1) GDPR).</p>
      <p>Where personal data is processed for direct marketing, you have the right to object at any time to processing of your personal data for that marketing. This also applies to profiling to the extent that it is related to such marketing. If you object, your personal data will no longer be used for direct marketing (objection under Art. 21 (2) GDPR).</p>
      <p>This website does not carry out direct marketing or tracking.</p>
      <h3>Right to lodge a complaint</h3>
      <p>If the GDPR is violated, data subjects have the right to lodge a complaint with a supervisory authority, in particular in the member state of their habitual residence, their place of work, or the place of the alleged infringement. This right is without prejudice to other administrative or judicial remedies.</p>
      <p>The supervisory authority responsible for Hamburg is the Hamburg Commissioner for Data Protection and Freedom of Information (Hamburgischer Beauftragter für Datenschutz und Informationsfreiheit).</p>
      <h3>Right to data portability</h3>
      <p>You have the right to receive data that we process automatically on the basis of your consent or a contract, in a common machine-readable format, or to have it transmitted to another controller where that is technically feasible. You can also download the books stored in your browser yourself, using the export function.</p>
      <h3>Access, rectification, and erasure</h3>
      <p>Under the applicable law you have the right, at any time and free of charge, to information about your stored personal data, its origin and recipients, and the purpose of processing, and where applicable a right to rectification or erasure. You can contact us at any time about this or about other questions on personal data.</p>
      <h3>Right to restriction of processing</h3>
      <p>You have the right to request restriction of processing of your personal data. You can contact us at any time. The right to restriction exists in these cases:</p>
      <ul>
        <li>If you contest the accuracy of your personal data stored by us, we usually need time to check it. For the duration of the check you have the right to request restriction of processing.</li>
        <li>If processing of your personal data was or is unlawful, you can request restriction instead of erasure.</li>
        <li>If we no longer need your personal data, but you need it to establish, exercise, or defend legal claims, you have the right to request restriction instead of erasure.</li>
        <li>If you have objected under Art. 21 (1) GDPR, your interests and ours must be weighed. While it is not yet clear whose interests prevail, you have the right to request restriction of processing.</li>
      </ul>
      <p>If you have restricted processing, this data — apart from storing it — may be processed only with your consent, or for the establishment, exercise, or defence of legal claims, or for the protection of the rights of another natural or legal person, or for reasons of important public interest of the European Union or a member state.</p>
      <h3>SSL or TLS encryption</h3>
      <p>This site uses SSL or TLS encryption for security and to protect the transmission of confidential content you send to us as the site operator. You can recognise an encrypted connection because the browser address changes from “http://” to “https://” and by the lock icon in the browser bar.</p>
      <p>When SSL or TLS encryption is active, the data you transmit to us cannot be read by third parties in transit.</p>

      <h2>4. Data collected on this website</h2>
      <h3>Server logs</h3>
      <p>The host of this website automatically collects and stores information in server log files, which your browser transmits. This can include in particular:</p>
      <ul>
        <li>browser type and browser version</li>
        <li>operating system</li>
        <li>referrer URL</li>
        <li>hostname of the accessing computer</li>
        <li>time of the server request</li>
        <li>IP address</li>
      </ul>
      <p>This data is not combined with other data sources. Collection is based on Art. 6 (1) (f) GDPR. The operator has a legitimate interest in the technically error-free presentation and the security of the website, which requires these server logs.</p>
      <h3>Cookies</h3>
      <p>This website does not set cookies of its own. In particular we do not set analytics, advertising, or tracking cookies. A cookie banner is therefore not required for cookies set by the site.</p>
      <h3>Storage in the browser</h3>
      <p>Books, chapters, manuscript text, book settings, writing progress, cover images, and a few display settings (such as whether the sidebar is collapsed, and whether the notice about browser storage has been dismissed) are stored in your browser’s IndexedDB. This storage is needed so the writing tool you are using keeps your text on this device. The legal basis is Art. 6 (1) (f) GDPR together with § 25 (2) no. 2 TDDDG, because the storage serves the use of the website that you requested.</p>
      <p>The entry is created when you use the website and create or open a book. You can delete individual books in the app. You can delete all storage for this website in your browser settings. No local storage or session storage entries are set for analytics or advertising.</p>
      <h3>Fonts</h3>
      <p>This website loads the fonts Outfit, Literata, and Noto Sans Mono through Google Fonts. When you open the page, your browser connects to Google’s servers (fonts.googleapis.com and fonts.gstatic.com). Google can learn the IP address of the device and technical details of the browser. The legal basis is Art. 6 (1) (f) GDPR. Our legitimate interest is a consistent appearance of the writing surface. We do not otherwise analyse how you use the site.</p>
      <h3>No analytics, advertising, or social plugins</h3>
      <p>We do not embed services such as YouTube, Google Analytics, the Meta pixel, or similar tracking tools. We do not evaluate how you use the site.</p>
    `,
  },
};

export function privacyPage(lang) {
  const copy = privacy[lang] || privacy.de;
  return shell(
    copy.title,
    `
      <div class="lang-switch">
        <button type="button" data-lang="de" class="${lang === "de" ? "is-active" : ""}">Deutsch</button>
        <button type="button" data-lang="en" class="${lang === "en" ? "is-active" : ""}">English</button>
      </div>
      <p class="legal-note">${copy.note}</p>
      ${copy.html}
      <p class="legal-source">${copy.source}</p>
    `
  );
}
