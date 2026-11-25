<script lang="ts">
  import { DATA_SOURCE_LABEL, SITE_FACTS } from './siteFacts'
</script>

<section class="py-16 sm:py-20 lg:py-28 bg-[#f6f8fb]" aria-labelledby="about-heading">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 id="about-heading" class="text-2xl min-[375px]:text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 text-center break-words hyphens-auto" style="color: #0f2744;">
      Die Arbeitsplattform für Gefahrgutbeauftragte
    </h2>

    <div class="space-y-6 sm:space-y-8 text-slate-600 text-[15px] leading-relaxed hyphens-auto">
      <div>
        <h3 class="font-semibold mb-2" style="color: #0f2744;">Multimodaler Regelwerksvergleich</h3>
        <p>
          gefahrgut.org stellt die Vorschriften aus ADR (Straße), RID (Schiene), IMDG-Code (See)
          und ICAO (Luft) für jede UN-Nummer nebeneinander dar. Gefahrklasse, Verpackungsgruppe,
          begrenzte und freigestellte Mengen, Verpackungsanweisungen und Sondervorschriften lassen
          sich verkehrsträgerübergreifend vergleichen, ohne zwischen vier Regelwerken zu blättern.
          Das ADN (Binnenschifffahrt) ist nicht enthalten, weil die BAM dafür keine Daten veröffentlicht.
        </p>
      </div>
      <div>
        <h3 class="font-semibold mb-2" style="color: #0f2744;">Datenbasis: {DATA_SOURCE_LABEL}</h3>
        <p>
          Grundlage ist die GEFAHRGUT-Datenbank der Bundesanstalt für Materialforschung und
          -prüfung (BAM): {SITE_FACTS.unNumbers} UN-Nummern mit
          {SITE_FACTS.entries} Einträgen aus ADR, RID, IMDG, ICAO und den UN-Modellvorschriften,
          dazu die Texte von {SITE_FACTS.specialProvisions} Sondervorschriften. Nach jeder jährlichen
          Regelwerksänderung wird der Datenbestand aus der Quelle neu eingespielt.
        </p>
      </div>
      <div>
        <h3 class="font-semibold mb-2" style="color: #0f2744;">Werkzeuge statt Nachschlagewerk</h3>
        <p>
          Heute gibt es die Stoffsuche, den Regelwerksvergleich, den 1000-Punkte-Rechner nach
          ADR 1.1.3.6 und das ADR als durchsuchbaren Lesetext (kein rechtsverbindlicher Text).
          Geplant sind ein Rechner für begrenzte und freigestellte Mengen (LQ/EQ) und ein
          Dokumentengenerator für Beförderungspapiere. Die Werkzeuge
          unterstützen dich; die Verantwortung für Einstufung und Papiere bleibt bei dir.
        </p>
      </div>
      <div>
        <h3 class="font-semibold mb-2" style="color: #0f2744;">Mehrsprachig</h3>
        <p>
          Das Vergleichswerkzeug lässt sich auf Deutsch, Englisch, Französisch und Türkisch
          bedienen; die Sondervorschriften gibt es auf Deutsch, Englisch und Französisch, soweit
          amtlich verfügbar – für internationale Teams in Spedition, Industrie und Beratung.
        </p>
      </div>
    </div>
  </div>
</section>
