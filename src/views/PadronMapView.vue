<template>
  <div class="h-[calc(100vh-80px)] flex bg-white overflow-hidden relative">
    <Transition name="fade">
      <div
        v-if="isFiltersOpen"
        class="absolute inset-0 z-[1999] bg-black/20 backdrop-blur-[1px] lg:hidden"
        @click="isFiltersOpen = false"
      />
    </Transition>

    <!-- ═══════════════════════════════════════════════
         SIDEBAR IZQUIERDO
    ═══════════════════════════════════════════════ -->
    <aside
      class="absolute left-0 top-0 z-[2000] w-[22rem] h-full bg-[#f8f9fb] border-r border-gray-200/80 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col"
      :class="isFiltersOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Header -->
      <div class="shrink-0 px-5 pt-5 pb-4 bg-[#012737] text-white">
        <div class="flex items-center justify-between mb-3">
          <button
            @click="router.back()"
            class="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-medium"
          >
            <ArrowLeft :size="13" /> Regresar
          </button>
          <button
            @click="isFiltersOpen = false"
            class="text-white/50 hover:text-white p-1 transition-colors rounded-md hover:bg-white/10"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="flex items-start gap-3 mb-4">
          <div class="p-2 bg-white/10 rounded-lg shrink-0">
            <MapIcon :size="18" class="text-[#4fc3f7]" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">
              Padrón Activo
            </p>
            <p class="text-sm font-bold text-white truncate">{{ padronNombre }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-white/10 rounded-xl p-2.5 text-center">
            <p class="text-lg font-black text-white leading-none">
              {{ totalSeleccionado.toLocaleString() }}
            </p>
            <p class="text-[9px] text-white/50 font-semibold mt-0.5 uppercase">Registros</p>
          </div>
          <div class="bg-white/10 rounded-xl p-2.5 text-center">
            <p class="text-lg font-black text-[#4fc3f7] leading-none">
              {{ filtrosActivos.length }}
            </p>
            <p class="text-[9px] text-white/50 font-semibold mt-0.5 uppercase">Filtros</p>
          </div>
          <div class="bg-white/10 rounded-xl p-2.5 text-center">
            <p class="text-lg font-black text-emerald-400 leading-none">
              {{ totalConCoordenadas.toLocaleString() }}
            </p>
            <p class="text-[9px] text-white/50 font-semibold mt-0.5 uppercase">En mapa</p>
          </div>
        </div>
      </div>

      <!-- Niveles de Vista -->
      <div class="shrink-0 px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <p class="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">
          Vista del mapa
        </p>
        <div class="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            v-for="btn in botonesNivel"
            :key="btn.nivel"
            @click="irANivel(btn.nivel)"
            :class="[
              'py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5',
              nivelActual === btn.nivel
                ? 'bg-white text-[#012737] shadow-sm'
                : 'text-gray-400 hover:text-gray-600',
            ]"
          >
            <component :is="btn.icon" :size="12" />
            {{ btn.label }}
          </button>
        </div>
      </div>

      <!-- Contenido scrollable -->
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <!-- ── 2. Municipios ── -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-3 py-2.5 border-b border-gray-50 flex items-center gap-2">
            <div class="p-1 bg-blue-50 rounded-md">
              <Building2 :size="11" class="text-blue-500" />
            </div>
            <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">
              Municipio
            </p>
            <span
              v-if="municipiosSeleccionados.length"
              class="ml-auto text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full"
            >
              {{ municipiosSeleccionados.length }}
            </span>
          </div>
          <div class="p-3 space-y-2">
            <div class="relative">
              <Search
                :size="13"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
              />
              <input
                v-model="busquedaMunicipio"
                @focus="dropdownAbierto = true"
                @blur="cerrarDropdownDelay"
                @input="onBusquedaMunicipioInput"
                placeholder="Buscar municipio..."
                class="w-full pl-8 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all placeholder:text-gray-300"
              />
              <button
                v-if="busquedaMunicipio"
                @mousedown.prevent="((busquedaMunicipio = ''), (busquedaNormalizada = ''))"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X :size="12" />
              </button>
            </div>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="dropdownAbierto && municipiosFiltrados.length"
                class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto z-10 relative"
              >
                <div
                  v-for="mun in municipiosFiltrados"
                  :key="mun.cvegeo"
                  @mousedown.prevent="elegirMunicipio(mun)"
                  :class="[
                    'px-3 py-2 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors',
                    municipiosSeleccionados.some((m) => m.cvegeo === mun.cvegeo)
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50',
                  ]"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <!-- Checkbox visual -->
                    <div
                      :class="[
                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        municipiosSeleccionados.some((m) => m.cvegeo === mun.cvegeo)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300',
                      ]"
                    >
                      <svg
                        v-if="municipiosSeleccionados.some((m) => m.cvegeo === mun.cvegeo)"
                        class="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="3"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="text-xs font-medium text-gray-800 truncate">{{ mun.nombre }}</span>
                  </div>
                  <span class="text-[9px] text-gray-400 font-mono shrink-0 ml-2">{{
                    mun.cvegeo
                  }}</span>
                </div>
              </div>
            </Transition>

            <!-- Chips seleccionados -->
            <div v-if="municipiosSeleccionados.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="m in municipiosSeleccionados"
                :key="m.cvegeo"
                class="inline-flex items-center gap-1 bg-[#012737] text-white text-[10px] font-semibold px-2 py-1 rounded-lg"
              >
                <MapPin :size="9" />
                {{ m.nombre }}
                <button
                  @click="removerMunicipio(m)"
                  class="opacity-60 hover:opacity-100 ml-0.5 hover:text-red-300 transition-colors"
                >
                  <X :size="9" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- ── 3. Código Postal ── -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-3 py-2.5 border-b border-gray-50 flex items-center gap-2">
            <div class="p-1 bg-violet-50 rounded-md">
              <Hash :size="11" class="text-violet-500" />
            </div>
            <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">
              Código Postal
            </p>
            <span
              v-if="cpsSeleccionados.length"
              class="ml-auto text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full"
            >
              {{ cpsSeleccionados.length }}
            </span>
          </div>
          <div class="p-3 space-y-2">
            <div class="flex gap-2">
              <input
                v-model="busquedaCP"
                @keydown.enter="agregarCP"
                maxlength="5"
                placeholder="Ej: 52000"
                :class="[
                  'flex-1 px-3 py-2.5 bg-gray-50 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-violet-400/20 transition-all placeholder:text-gray-300',
                  cpValido
                    ? 'border-violet-400 focus:border-violet-400'
                    : 'border-gray-200 focus:border-violet-400',
                  cpError ? 'border-red-400' : '',
                ]"
              />
              <button
                @click="agregarCP"
                :disabled="!cpValido || buscandoCP"
                class="bg-[#012737] text-white px-4 py-2 text-[10px] font-black rounded-lg disabled:opacity-40 hover:bg-[#177DA6] transition-colors"
              >
                <Loader2 v-if="buscandoCP" :size="12" class="animate-spin" />
                <span v-else>+</span>
              </button>
            </div>
            <p v-if="cpError" class="text-[10px] text-red-500 flex items-center gap-1">
              <span
                class="w-3 h-3 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[8px] font-black"
                >!</span
              >
              {{ cpError }}
            </p>
            <div v-if="cpsSeleccionados.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="cp in cpsSeleccionados"
                :key="cp"
                class="inline-flex items-center gap-1 bg-violet-600 text-white text-[10px] font-semibold px-2 py-1 rounded-lg"
              >
                <Hash :size="9" />
                {{ cp }}
                <span class="text-white/50 text-[9px]"
                  >({{ resultadosPorCP[cp]?.length || 0 }})</span
                >
                <button
                  @click="removerCP(cp)"
                  class="opacity-60 hover:opacity-100 ml-0.5 hover:text-red-300"
                >
                  <X :size="9" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- ── 4. Coordenadas exactas ── -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-3 py-2.5 border-b border-gray-50 flex items-center gap-2">
            <div class="p-1 bg-emerald-50 rounded-md">
              <Crosshair :size="11" class="text-emerald-500" />
            </div>
            <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">
              Coordenadas
            </p>
            <span
              v-if="coordInput.lat && coordInput.lng"
              class="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
          </div>
          <div class="p-3 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-1"
                  >Latitud</label
                >
                <input
                  v-model="coordInput.lat"
                  placeholder="19.4326"
                  type="number"
                  step="0.0001"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all placeholder:text-gray-300"
                />
              </div>
              <div>
                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-1"
                  >Longitud</label
                >
                <input
                  v-model="coordInput.lng"
                  placeholder="-99.1332"
                  type="number"
                  step="0.0001"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
            <button
              @click="irACoordenadas"
              :disabled="!coordsValidas"
              class="w-full py-2 rounded-lg text-[11px] font-black uppercase tracking-wide text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <Crosshair :size="12" />
              Ir a coordenadas
            </button>
          </div>
        </div>

        <!-- ── Botón limpiar ── -->
        <Transition name="slide-down">
          <button
            v-if="filtrosActivos.length || resultadosKeyword.length"
            @click="limpiarTodosFiltros"
            class="w-full py-2.5 rounded-xl border border-dashed border-red-200 text-[11px] font-bold text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all flex items-center justify-center gap-2"
          >
            <X :size="13" />
            Limpiar todo
          </button>
        </Transition>

        <!-- ── Desglose ── -->
        <div v-if="filtrosActivos.length" class="space-y-2">
          <p class="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Desglose</p>

          <div
            v-for="mun in municipiosSeleccionados"
            :key="mun.cvegeo"
            class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-2 h-2 rounded-full bg-[#177DA6] shrink-0"></div>
              <span class="text-xs font-semibold text-gray-700 truncate">{{ mun.nombre }}</span>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-black text-[#012737]">
                {{
                  (
                    datosCoropletas.find((d) => normalizar(d.municipio) === normalizar(mun.nombre))
                      ?.total || 0
                  ).toLocaleString()
                }}
              </p>
              <p class="text-[9px] text-gray-400">registros</p>
            </div>
          </div>

          <div
            v-for="cp in cpsSeleccionados"
            :key="cp"
            class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-violet-400 shrink-0"></div>
              <span class="text-xs font-semibold text-gray-700 font-mono">CP {{ cp }}</span>
            </div>
            <div class="text-right">
              <p class="text-sm font-black text-[#012737]">
                {{ (resultadosPorCP[cp]?.length || 0).toLocaleString() }}
              </p>
              <p class="text-[9px] text-gray-400">
                {{ resultadosPorCP[cp]?.filter((r) => r.latitud && r.longitud).length || 0 }} coords
              </p>
            </div>
          </div>
        </div>

        <!-- Total sin filtros -->
        <div
          v-if="!filtrosActivos.length && !resultadosKeyword.length"
          class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-500">Total Estado</span>
            <span class="text-sm font-black text-[#012737]">{{
              totalSeleccionado.toLocaleString()
            }}</span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-[10px] text-gray-400">Con coordenadas</span>
            <span class="text-[10px] font-bold text-emerald-600">{{
              totalConCoordenadas.toLocaleString()
            }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="shrink-0 p-4 border-t border-gray-200/70 bg-white">
        <Transition name="fade" mode="out-in">
          <div v-if="store.mapLoading" key="loading" class="flex items-center gap-2 justify-center">
            <div
              class="w-3.5 h-3.5 border-2 border-[#177DA6] border-t-transparent rounded-full animate-spin"
            ></div>
            <span class="text-[11px] font-black text-gray-500 uppercase tracking-widest"
              >Consultando...</span
            >
          </div>
          <div v-else key="idle" class="flex items-center justify-between">
            <p class="text-[10px] text-gray-400">
              <span class="font-bold text-gray-600">{{ totalContador }}</span>
              {{ modoMapa === 'puntos' ? ' puntos en vista' : ' agrupaciones' }}
            </p>
            <span
              :class="[
                'text-[9px] font-bold px-2 py-1 rounded-full',
                modoMapa === 'puntos'
                  ? 'bg-emerald-50 text-emerald-600'
                  : modoMapa === 'clusters'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-500',
              ]"
            >
              {{ modoMapa }}
            </span>
          </div>
        </Transition>
      </div>
    </aside>

    <!-- ═══════════════════════════════════════════════
         MAPA
    ═══════════════════════════════════════════════ -->
    <main class="flex-1 relative overflow-hidden">
      <button
        @click="isFiltersOpen = true"
        class="absolute top-4 left-4 z-[1000] bg-white p-2.5 rounded-xl shadow-lg text-gray-600 hover:text-[#177DA6] transition-all hover:shadow-xl border border-gray-100"
      >
        <div class="relative">
          <Filter :size="18" />
          <span
            v-if="filtrosActivos.length || resultadosKeyword.length"
            class="absolute -top-2 -right-2 w-4 h-4 bg-[#177DA6] text-white text-[8px] font-black rounded-full flex items-center justify-center"
          >
            {{ filtrosActivos.length + (resultadosKeyword.length ? 1 : 0) }}
          </span>
        </div>
      </button>

      <Transition name="fade">
        <div
          v-if="store.mapLoading"
          class="absolute inset-0 z-[2000] flex items-center justify-center bg-white/30 backdrop-blur-[2px]"
        >
          <div
            class="bg-white/95 px-6 py-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-3"
          >
            <div
              class="w-8 h-8 border-[3px] border-[#177DA6] border-t-transparent rounded-full animate-spin"
            ></div>
            <div class="text-center">
              <p class="text-xs font-black text-gray-800 uppercase tracking-widest">Actualizando</p>
              <p class="text-[10px] text-gray-400">Consultando base de datos...</p>
            </div>
          </div>
        </div>
      </Transition>

      <div class="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          @click="mapRef?.resetView()"
          class="bg-white p-2.5 rounded-xl shadow-lg text-gray-600 hover:text-[#177DA6] transition-all hover:shadow-xl border border-gray-100"
        >
          <Crosshair :size="18" />
        </button>
      </div>

      <Transition name="slide-down-center">
        <div
          v-if="mostrarBotonBusquedaArea"
          class="absolute top-6 left-1/2 -translate-x-1/2 z-[1000]"
        >
          <button
            @click="buscarEnAreaActiva"
            class="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-xl border border-gray-200 text-sm font-bold text-[#012737] hover:bg-[#012737] hover:text-white transition-all"
          >
            <RefreshCw :size="15" /> Buscar en esta área
          </button>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="(filtrosActivos.length && modoMapaForzado) || resultadosKeyword.length"
          class="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]"
        >
          <div
            class="flex items-center gap-2 bg-[#012737] text-white px-4 py-2 rounded-full shadow-lg text-[11px] font-bold"
          >
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Mostrando {{ registrosActuales.length.toLocaleString() }} puntos
            <span v-if="resultadosKeyword.length" class="opacity-60"
              >· búsqueda: "{{ queryKeyword }}"</span
            >
          </div>
        </div>
      </Transition>

      <MapView
        ref="mapRef"
        :registros="registrosActuales"
        :modo="modoMapa"
        :datos-coropletas="datosCoropletas"
        :municipio-filtro="
          municipiosSeleccionados.length === 1 ? municipiosSeleccionados[0].nombre : null
        "
        :tiene-coordenadas="tieneCoordenadas"
        @view-change="onMapMove"
        @zoom-nivel="onZoomNivel"
        @select="onSelectRegistro"
        @municipio-click="onMunicipioClickAislado"
        @seccion-click="onSeccionClick"
        @cluster-click="onClusterClick"
      />
      <Transition name="slide-up-banner">
        <div
          v-if="resumenMunicipioActivo || cargandoResumenMunicipio"
          class="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1500] w-[95%] max-w-3xl px-4"
        >
          <div
            class="relative bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-t-blue-500/30"
          >
            <div
              v-if="cargandoResumenMunicipio"
              class="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"
            ></div>

            <div class="p-8">
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-5">
                  <div
                    class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-inner"
                  >
                    <Building2
                      v-if="!resumenMunicipioActivo?.seccion"
                      :size="24"
                      class="text-blue-400"
                    />
                    <Hash v-else :size="24" class="text-cyan-400" />
                  </div>
                  <div class="flex flex-col">
                    <span
                      class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80 mb-1"
                    >
                      {{
                        resumenMunicipioActivo?.seccion
                          ? 'Análisis de Sección'
                          : 'Análisis Municipal'
                      }}
                    </span>
                    <h4 class="text-3xl font-black text-white tracking-tighter leading-tight">
                      {{ resumenMunicipioActivo?.municipio }}
                    </h4>
                  </div>
                </div>

                <button
                  @click="resumenMunicipioActivo = null"
                  class="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-full transition-all group"
                >
                  <X :size="20" class="text-white/30 group-hover:text-red-400" />
                </button>
              </div>

              <div v-if="resumenMunicipioActivo" class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                  <div
                    class="flex flex-col justify-center p-6 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 transition-colors"
                  >
                    <span
                      class="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-2"
                      >Población Registrada</span
                    >
                    <div class="flex items-baseline gap-2">
                      <span class="text-4xl font-black text-white tabular-nums leading-none">
                        {{ resumenMunicipioActivo.total?.toLocaleString() }}
                      </span>
                      <span class="text-blue-500 font-bold text-[10px] uppercase">Reg.</span>
                    </div>
                  </div>

                  <div
                    v-if="resumenMunicipioActivo.meta?.clave_muestra"
                    class="flex flex-col justify-center p-6 bg-blue-500/5 border border-blue-500/20 rounded-[1.5rem]"
                  >
                    <span
                      class="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.1em] mb-2"
                      >Clave de Zona</span
                    >
                    <div class="flex items-center gap-3">
                      <Database :size="18" class="text-blue-500/40" />
                      <span
                        class="text-2xl font-mono font-bold text-blue-100 leading-none truncate"
                      >
                        {{ resumenMunicipioActivo.meta.clave_muestra }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="relative bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden"
                >
                  <div
                    class="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-6"
                  >
                    <span class="text-[9px] font-black uppercase tracking-tighter text-white/40">
                      {{
                        resumenMunicipioActivo.seccion
                          ? `Desglose de Sección Electoral`
                          : 'Detalles de Base de Datos'
                      }}
                    </span>
                  </div>

                  <div
                    class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 overflow-y-auto pr-4 custom-scroll max-h-[200px] p-6 mt-8"
                  >
                    <div
                      v-for="item in resumenMunicipioActivo.detalles"
                      :key="item.label"
                      class="flex flex-col border-l-2 border-white/5 pl-3 hover:border-blue-500/50 transition-all group"
                    >
                      <span
                        class="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-1 truncate group-hover:text-blue-400/50"
                      >
                        {{ item.label }}
                      </span>
                      <span
                        class="text-[13px] font-bold text-slate-200 tabular-nums truncate"
                        :title="item.value"
                      >
                        {{ item.value || '—' }}
                      </span>
                    </div>
                  </div>

                  <div
                    class="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <!-- Panel derecho — Detalle -->
    <Transition name="slide-right">
      <aside
        v-if="registroSeleccionado"
        class="absolute right-0 top-0 z-[3000] w-80 h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col"
      >
        <div
          class="p-5 border-b border-gray-100 flex items-center justify-between"
          style="background: #012737"
        >
          <h3 class="font-bold text-white text-sm flex items-center gap-2">
            <Database :size="16" /> Detalle del Registro
          </h3>
          <button @click="cerrarPanel" class="p-1 text-white/60 hover:text-white transition-colors">
            <X :size="18" />
          </button>
        </div>

        <div
          class="shrink-0 px-4 py-3 border-b border-gray-200 flex gap-2"
          style="background: #fdfcfa"
        >
          <button
            @click="abrirEdicion"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white border border-gray-200 hover:shadow-sm transition-all text-gray-700"
          >
            <Edit2 :size="12" /> Editar
          </button>
          <button
            @click="abrirEliminacion"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white border border-red-100 hover:bg-red-50 transition-all text-red-600"
          >
            <Trash2 :size="12" /> Eliminar
          </button>
          <button
            @click="generarFichaPDF"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white border border-blue-100 hover:bg-blue-50 transition-all text-blue-600"
          >
            <FileText :size="12" /> PDF
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-2.5">
          <div v-if="cargandoDetalle" class="space-y-3">
            <div v-for="i in 6" :key="i" class="bg-gray-100 animate-pulse h-12 rounded-lg"></div>
          </div>
          <template v-else>
            <p
              class="text-[9px] font-black uppercase tracking-[0.2em] px-1 pt-1 pb-1"
              style="color: #94a3b8"
            >
              Atributos Base
            </p>
            <template v-for="(val, key) in camposFijosRegistro" :key="key">
              <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{{ key }}</p>
                <p class="text-sm font-semibold text-gray-800">{{ val }}</p>
              </div>
            </template>
            <template v-if="Object.keys(datosExtra).length">
              <p
                class="text-[9px] font-black uppercase tracking-[0.2em] px-1 pt-3 pb-1"
                style="color: #94a3b8"
              >
                Datos adicionales
              </p>
              <div
                v-for="(v, k) in datosExtra"
                :key="k"
                class="bg-gray-50 p-3 rounded-lg border border-gray-100"
              >
                <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">
                  {{ k.replace(/_/g, ' ') }}
                </p>
                <p class="text-sm font-semibold text-gray-800">{{ v }}</p>
              </div>
            </template>
          </template>
        </div>
      </aside>
    </Transition>

    <Teleport to="body">
      <DatoUpdateModal
        v-if="showUpdate"
        :padron-id="route.params.id"
        :dato="datoAEditar"
        @close="showUpdate = false"
        @updated="handleSuccess"
      />
      <DatoDeleteModal
        v-if="showDelete"
        :padron-id="route.params.id"
        :dato="datoAEliminar"
        @close="showDelete = false"
        @deleted="handleSuccess"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { useMunicipios } from '@/composables/useMunicipios'
import MapView from '@/components/MapView.vue'
import {
  Map as MapIcon,
  X,
  Search,
  MapPin,
  ArrowLeft,
  Filter,
  Crosshair,
  Building2,
  Hash,
  RefreshCw,
  Edit2,
  Trash2,
  FileText,
  Database,
  Loader2,
} from 'lucide-vue-next'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '@/assets/Logo-Vertical.png'
import DatoUpdateModal from '@/components/dashboards/admin/DatoUpdateModal.vue'
import DatoDeleteModal from '@/components/dashboards/admin/DatoDeleteModal.vue'

const route = useRoute()
const router = useRouter()
const store = usePadronStore()
const { todos: todosMunicipios, normalizar } = useMunicipios()
// AGREGA ESTA LÍNEA si no existe:
let ultimaAreaConsultada = null
// ── Estado Principal ─────────────────────────────────────────────────────────
const mapRef = ref(null)
const isFiltersOpen = ref(false)
const nivelActual = ref('estado')
const modoMapa = ref('estado')
const datosCoropletas = ref([])
const registroSeleccionado = ref(null)
const cargandoDetalle = ref(false)
const tieneCoordenadas = ref(false)

// ── Estado del Banner Informativo ───────────────────────────────────────────
const resumenMunicipioActivo = ref(null)
const cargandoResumenMunicipio = ref(false)

// ── Filtros Sidebar ──────────────────────────────────────────────────────────
const municipiosSeleccionados = ref([])
const cpsSeleccionados = ref([])
const resultadosPorMunicipio = ref({})
const resultadosPorCP = ref({})

// ── Búsqueda Keyword y Otros ────────────────────────────────────────────────
const queryKeyword = ref('')
const buscandoKeyword = ref(false)
const resultadosKeyword = ref([])
const coordInput = ref({ lat: '', lng: '' })
const busquedaCP = ref('')
const buscandoCP = ref(false)
const cpError = ref('')
const busquedaMunicipio = ref('')
const busquedaNormalizada = ref('')
const dropdownAbierto = ref(false)
const cargandoMunicipio = ref(false)
const mostrarBotonBusquedaArea = ref(false)
const datosVistaPendiente = ref(null)
const autoCargarSiguienteMove = ref(false)

// ── Modales ──────────────────────────────────────────────────────────────────
const showUpdate = ref(false)
const showDelete = ref(false)
const datoAEditar = ref(null)
const datoAEliminar = ref(null)

let _closeTimer = null
let _moveTimer = null
let _debounceTimer = null

// ── HELPERS ──────────────────────────────────────────────────────────────────
const VACIOS = new Set(['', 'sin nombre', 'n/a', 'null', 'undefined', '-', '—', '0'])
const tieneValor = (v) => v != null && !VACIOS.has(String(v).trim().toLowerCase())

/**
 * Normalización Agresiva (Espejo de la lógica en PHP)
 * "NEXTLALPAN *" -> "nextlalpan"
 */
const normalizarParaMatch = (str) => {
  if (!str) return ''
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// ── COMPUTED ─────────────────────────────────────────────────────────────────
const padronNombre = computed(
  () => store.padrones.find((p) => p.id === route.params.id)?.nombre_padron || 'Cargando...',
)

const botonesNivel = computed(() => {
  const base = [
    { nivel: 'estado', label: 'Estado', icon: MapIcon },
    { nivel: 'municipio', label: 'Municipio', icon: Building2 },
  ]
  if (tieneCoordenadas.value) base.push({ nivel: 'punto', label: 'Detalle', icon: Crosshair })
  return base
})

const municipiosFiltrados = computed(() => {
  const q = busquedaNormalizada.value.trim()
  if (!q) return todosMunicipios.slice(0, 40)
  return todosMunicipios
    .map((m) => {
      const nombre = normalizar(m.nombre)
      const cvegeo = m.cvegeo || ''
      let score = 0
      if (nombre === q || cvegeo === q) score = 100
      else if (nombre.startsWith(q)) score = 80
      else if (cvegeo.startsWith(q)) score = 75
      else if (nombre.includes(q)) score = 50
      else if (cvegeo.includes(q)) score = 40
      else return null
      return { ...m, _score: score }
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score)
    .slice(0, 30)
})

const todosLosRegistrosCombinados = computed(() => {
  if (resultadosKeyword.value.length) return resultadosKeyword.value
  const lista = []
  Object.values(resultadosPorMunicipio.value).forEach((r) => lista.push(...r))
  Object.values(resultadosPorCP.value).forEach((r) => lista.push(...r))
  const vistos = new Set()
  return lista.filter((r) => {
    if (vistos.has(r.id)) return false
    vistos.add(r.id)
    return true
  })
})

const modoMapaForzado = computed(() => {
  const totalFiltros = municipiosSeleccionados.value.length + cpsSeleccionados.value.length
  return (
    (totalFiltros >= 1 || resultadosKeyword.value.length > 0) &&
    todosLosRegistrosCombinados.value.length > 0
  )
})

const registrosActuales = computed(() => {
  if (modoMapaForzado.value) return todosLosRegistrosCombinados.value
  if (modoMapa.value === 'clusters') return store.clusters
  if (modoMapa.value === 'puntos') return store.beneficiarios
  return []
})

const filtrosActivos = computed(() => {
  const list = []
  municipiosSeleccionados.value.forEach((m) =>
    list.push({ id: m.cvegeo, tipo: 'municipio', label: m.nombre }),
  )
  cpsSeleccionados.value.forEach((cp) => list.push({ id: cp, tipo: 'cp', label: `CP ${cp}` }))
  return list
})

const totalSeleccionado = computed(() => {
  if (resumenMunicipioActivo.value) return resumenMunicipioActivo.value.total
  if (!filtrosActivos.value.length && !resultadosKeyword.value.length)
    return datosCoropletas.value.reduce((acc, d) => acc + parseInt(d.total || 0), 0)
  return todosLosRegistrosCombinados.value.length
})

const totalConCoordenadas = computed(() => {
  if (!filtrosActivos.value.length && !resultadosKeyword.value.length)
    return datosCoropletas.value.reduce(
      (acc, d) => acc + parseInt(d.total_con_coordenadas || d.tiene_coordenadas || 0),
      0,
    )
  return todosLosRegistrosCombinados.value.filter(
    (r) => r.latitud && r.longitud && r.latitud !== '0',
  ).length
})

const totalContador = computed(() => {
  if (modoMapaForzado.value) return registrosActuales.value.length.toLocaleString()
  if (modoMapa.value === 'clusters')
    return store.clusters.reduce((a, c) => a + (parseInt(c.count) || 0), 0).toLocaleString()
  return store.beneficiarios.length.toLocaleString()
})

const camposFijosRegistro = computed(() => {
  const r = registroSeleccionado.value
  if (!r) return {}
  return Object.fromEntries(
    Object.entries({
      'Clave única': r.clave_unica,
      Nombre: r.nombre_completo,
      Municipio: r.municipio,
      Sección: r.seccion,
      'C.P.': r.codigo_postal,
      Latitud: r.latitud,
      Longitud: r.longitud,
    }).filter(([, v]) => tieneValor(v)),
  )
})

const datosExtra = computed(() => {
  const d = registroSeleccionado.value?.datos_generales
  if (!d) return {}
  try {
    const obj = typeof d === 'string' ? JSON.parse(d) : d
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => tieneValor(v)))
  } catch {
    return {}
  }
})

const coordsValidas = computed(() => {
  const lat = Number(coordInput.value.lat)
  const lng = Number(coordInput.value.lng)
  return (
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180 &&
    coordInput.value.lat !== '' &&
    coordInput.value.lng !== ''
  )
})

const cpValido = computed(() => /^\d{5}$/.test(busquedaCP.value))

// ── ACCIONES ─────────────────────────────────────────────────────────────────

const cerrarResumenMunicipio = () => {
  resumenMunicipioActivo.value = null
}

const onMunicipioClickAislado = async ({ nombre }) => {
  cargandoResumenMunicipio.value = true
  resumenMunicipioActivo.value = null

  try {
    const data = await store.fetchResumenAgnostico(route.params.id, nombre)

    if (data) {
      // 1. Actualizar el Banner con la info general del municipio
      resumenMunicipioActivo.value = data

      // 2. Si hay secciones, pedirle al mapa que las pinte
      if (data.hay_secciones) {
        mapRef.value?.dibujarSecciones(data)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    cargandoResumenMunicipio.value = false
  }
}

// Nuevo manejador para cuando se hace clic en una sección específica
const onSeccionClick = (payload) => {
  // Actualizamos el banner con los datos específicos de la sección
  resumenMunicipioActivo.value = {
    municipio: `Sección ${payload.seccion}`,
    total: payload.detalles.length > 0 ? 'Información disponible' : 0,
    detalles: payload.detalles,
    meta: {
      nombre_muestra: payload.meta.nombre,
      clave_muestra: payload.meta.clave,
    },
  }
}

const buscarPorKeyword = async () => {
  const q = queryKeyword.value.trim()
  if (q.length < 2) return
  buscandoKeyword.value = true
  try {
    const res = await store.buscarGlobal(route.params.id, q, 1, 2000)
    resultadosKeyword.value = Array.isArray(res) ? res : store.beneficiarios || []
    if (resultadosKeyword.value.length) {
      modoMapa.value = 'puntos'
      nivelActual.value = 'punto'
      const conCoords = resultadosKeyword.value.find((r) => r.latitud && r.longitud)
      if (conCoords)
        mapRef.value?.flyToRegistro(Number(conCoords.latitud), Number(conCoords.longitud), 13)
    }
  } finally {
    buscandoKeyword.value = false
  }
}

const limpiarKeyword = () => {
  resultadosKeyword.value = []
  queryKeyword.value = ''
}

const irACoordenadas = () => {
  if (!coordsValidas.value) return
  mapRef.value?.flyToRegistro(Number(coordInput.value.lat), Number(coordInput.value.lng), 17)
}

const onBusquedaMunicipioInput = () => {
  clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => {
    busquedaNormalizada.value = normalizar(busquedaMunicipio.value)
    dropdownAbierto.value = true
  }, 180)
}

const elegirMunicipio = async (mun) => {
  if (municipiosSeleccionados.value.some((m) => m.cvegeo === mun.cvegeo)) {
    removerMunicipio(mun)
    dropdownAbierto.value = true
    return
  }
  municipiosSeleccionados.value.push(mun)
  dropdownAbierto.value = true
  cargandoMunicipio.value = true
  try {
    const res = await store.buscarPorMunicipio(route.params.id, mun.nombre)
    if (res && res.length) {
      resultadosPorMunicipio.value = { ...resultadosPorMunicipio.value, [mun.cvegeo]: res }
    }
    if (municipiosSeleccionados.value.length === 1) {
      mapRef.value?.zoomToMunicipio(mun.nombre)
    }
  } finally {
    cargandoMunicipio.value = false
  }
}

const removerMunicipio = (mun) => {
  municipiosSeleccionados.value = municipiosSeleccionados.value.filter(
    (m) => m.cvegeo !== mun.cvegeo,
  )
  const next = { ...resultadosPorMunicipio.value }
  delete next[mun.cvegeo]
  resultadosPorMunicipio.value = next
}

const agregarCP = async () => {
  if (!cpValido.value) return
  const cp = busquedaCP.value
  if (cpsSeleccionados.value.includes(cp)) {
    busquedaCP.value = ''
    return
  }
  buscandoCP.value = true
  cpError.value = ''
  try {
    const res = await store.buscarInteligente(route.params.id, cp)
    if (res && res.length > 0) {
      cpsSeleccionados.value.push(cp)
      resultadosPorCP.value = { ...resultadosPorCP.value, [cp]: res }
      const conCoords = res.find((r) => r.latitud && r.longitud)
      if (conCoords)
        mapRef.value?.flyToRegistro(Number(conCoords.latitud), Number(conCoords.longitud), 14)
    } else {
      cpError.value = 'Sin registros para este CP'
    }
  } catch {
    cpError.value = 'Error al buscar el CP'
  } finally {
    buscandoCP.value = false
    busquedaCP.value = ''
  }
}

const removerCP = (cp) => {
  cpsSeleccionados.value = cpsSeleccionados.value.filter((c) => c !== cp)
  const next = { ...resultadosPorCP.value }
  delete next[cp]
  resultadosPorCP.value = next
}

const limpiarTodosFiltros = () => {
  municipiosSeleccionados.value = []
  cpsSeleccionados.value = []
  resultadosPorMunicipio.value = {}
  resultadosPorCP.value = {}
  resultadosKeyword.value = []
  queryKeyword.value = ''
  busquedaCP.value = ''
  busquedaMunicipio.value = ''
  busquedaNormalizada.value = ''
  coordInput.value = { lat: '', lng: '' }
  registroSeleccionado.value = null
  resumenMunicipioActivo.value = null
  mostrarBotonBusquedaArea.value = false
  modoMapa.value = 'estado'
  nivelActual.value = 'estado'
  mapRef.value?.resetView()
  mapRef.value?.highlightRegistro(null)
}

// ── MAPA Y NAVEGACIÓN ────────────────────────────────────────────────────────

const onMapMove = (datosVista) => {
  clearTimeout(_moveTimer)
  _moveTimer = setTimeout(() => {
    if (modoMapaForzado.value) return
    datosVistaPendiente.value = datosVista
    if (autoCargarSiguienteMove.value) {
      autoCargarSiguienteMove.value = false
      buscarEnAreaActiva()
      return
    }
    const oldB = ultimaAreaConsultada
    const newB = datosVista.bounds
    if (oldB && newB && Math.abs(oldB[0][0] - newB[0][0]) < 0.01) {
      mostrarBotonBusquedaArea.value = false
      return
    }
    mostrarBotonBusquedaArea.value = true
  }, 300)
}

const buscarEnAreaActiva = async () => {
  if (!datosVistaPendiente.value) return
  mostrarBotonBusquedaArea.value = false
  const { nivel, bounds, zoom } = datosVistaPendiente.value
  ultimaAreaConsultada = bounds
  if (nivel === 'estado') modoMapa.value = 'estado'
  else if (nivel === 'municipio') {
    modoMapa.value = 'clusters'
    await store.fetchMapaDatos(route.params.id, { bounds, nivel, zoom }, 'clusters')
  } else if (nivel === 'punto' && tieneCoordenadas.value) {
    modoMapa.value = 'puntos'
    await store.fetchMapaDatos(route.params.id, { bounds, nivel, zoom }, 'puntos')
  }
}

const onZoomNivel = (nivel) => {
  nivelActual.value = nivel
}
const onClusterClick = () => {
  autoCargarSiguienteMove.value = true
  mostrarBotonBusquedaArea.value = false
}

const irANivel = (nivel) => {
  mostrarBotonBusquedaArea.value = false
  if (nivel === 'estado') limpiarTodosFiltros()
  else if (nivel === 'municipio' && municipiosSeleccionados.value.length > 0) {
    const lastMun = municipiosSeleccionados.value[municipiosSeleccionados.value.length - 1]
    mapRef.value?.zoomToMunicipio(lastMun.nombre)
  }
}

const onSelectRegistro = async (r) => {
  registroSeleccionado.value = r
  cargandoDetalle.value = true
  const detalle = await store.fetchDetalleBeneficiario(route.params.id, r.id)
  if (registroSeleccionado.value?.id === r.id) {
    registroSeleccionado.value = detalle ?? r
  }
  cargandoDetalle.value = false
}

const cerrarPanel = () => {
  registroSeleccionado.value = null
  mapRef.value?.highlightRegistro(null)
}

// ── MODALES Y EXPORTACIÓN ────────────────────────────────────────────────────

const abrirEdicion = () => {
  datoAEditar.value = registroSeleccionado.value
  showUpdate.value = true
}
const abrirEliminacion = () => {
  datoAEliminar.value = registroSeleccionado.value
  showDelete.value = true
}
const handleSuccess = async () => {
  showUpdate.value = false
  showDelete.value = false
  registroSeleccionado.value = null
  if (datosVistaPendiente.value) {
    autoCargarSiguienteMove.value = true
    buscarEnAreaActiva()
  } else mapRef.value?.resetView()
}

const generarFichaPDF = async () => {
  const r = registroSeleccionado.value
  if (!r) return
  const doc = new jsPDF('p', 'mm', 'a4')
  const azulOscuro = [1, 39, 55]
  const grisTexto = [100, 116, 139]
  try {
    const b64 = await new Promise((res) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        res(canvas.toDataURL('image/png'))
      }
      img.src = logoUrl
    })
    doc.addImage(b64, 'PNG', 15, 12, 35, 12)
  } catch (e) {}
  doc.setFontSize(8)
  doc.setTextColor(...grisTexto)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 195, 15, { align: 'right' })
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...azulOscuro)
  doc.text('EXPEDIENTE INDIVIDUAL', 195, 25, { align: 'right' })
  doc.setDrawColor(226, 232, 240)
  doc.line(15, 30, 195, 30)
  autoTable(doc, {
    startY: 55,
    head: [['ATRIBUTO', 'VALOR']],
    body: Object.entries(camposFijosRegistro.value).map(([k, v]) => [k.toUpperCase(), v]),
    theme: 'grid',
    headStyles: { fillColor: azulOscuro },
  })
  doc.save(`Ficha_${r.id}.pdf`)
}

// ── CICLO DE VIDA ─────────────────────────────────────────────────────────────

onMounted(async () => {
  if (store.status === 'idle' || store.status === 'error') await store.fetchPadrones()
  const res = await store.fetchResumenAgnostico(route.params.id)
  if (Array.isArray(res)) {
    datosCoropletas.value = res
    tieneCoordenadas.value = res.some((r) => r.tiene_coordenadas)
  }

  const { lat, lng, zoom, municipio, cp } = route.query
  if (lat && lng) {
    modoMapa.value = 'puntos'
    nivelActual.value = 'punto'
    await nextTick()
    await new Promise((r) => setTimeout(r, 600))
    mapRef.value?.flyToRegistro(Number(lat), Number(lng), Number(zoom) || 18)
  } else if (municipio) {
    const munObj = todosMunicipios.find((m) => normalizar(m.nombre) === normalizar(municipio))
    if (munObj) elegirMunicipio(munObj)
  }
})

onUnmounted(() => {
  clearTimeout(_closeTimer)
  clearTimeout(_moveTimer)
  clearTimeout(_debounceTimer)
})

watch(modoMapaForzado, (val) => {
  if (val) {
    modoMapa.value = 'puntos'
    nivelActual.value = 'punto'
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.slide-down-center-enter-active,
.slide-down-center-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-center-enter-from,
.slide-down-center-leave-to {
  opacity: 0;
  transform: translateY(-12px) translateX(-50%);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 2px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
/* Animación para el banner del municipio */
.slide-up-banner-enter-active,
.slide-up-banner-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-banner-enter-from,
.slide-up-banner-leave-to {
  opacity: 0;
  transform: translateY(30px) translateX(-50%);
}

/* Scroll pequeño para los tags del banner */
.custom-scroll::-webkit-scrollbar {
  width: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
/* Animación de entrada y salida del banner */
.slide-up-banner-enter-active,
.slide-up-banner-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-banner-enter-from,
.slide-up-banner-leave-to {
  opacity: 0;
  transform: translateY(40px) translateX(-50%);
}

/* Scroll minimalista para los datos del JSON */
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(79, 195, 247, 0.3);
  border-radius: 10px;
}
</style>
