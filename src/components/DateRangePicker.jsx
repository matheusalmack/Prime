import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon } from '@hugeicons/core-free-icons';
import { addDays, addMonths, calendarWeeks, formatDate, formatRange, fromDateKey, getPresets, getToday, normalizeRange, sortRange, startOfMonth } from './dateRange';
import './DateRangePicker.css';

export { createTodayRange, getToday } from './dateRange';

const weekdays = ['do', '2ª', '3ª', '4ª', '5ª', '6ª', 'sá'];
const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function PickerIcon({ icon, size = 18 }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.7} color="currentColor" aria-hidden="true" />;
}

export default function DateRangePicker({ value, onChange }) {
  const id = useId();
  const today = getToday();
  const maxDate = today;
  const normalized = normalizeRange(value);
  const committed = { start: normalized.start > maxDate ? maxDate : normalized.start, end: normalized.end > maxDate ? maxDate : normalized.end };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(committed);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [month, setMonth] = useState(startOfMonth(committed.start));
  const [focusedDate, setFocusedDate] = useState(committed.start);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [position, setPosition] = useState(null);
  const [dualMonth, setDualMonth] = useState(() => window.matchMedia('(min-width: 820px)').matches);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const dayRefs = useRef(new Map());
  const focusCalendarRef = useRef(false);
  const visibleMonths = dualMonth ? [month, addMonths(month, 1)] : [month];

  useEffect(() => {
    const query = window.matchMedia('(min-width: 820px)');
    const update = () => setDualMonth(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (open && !dualMonth) {
      setMonth(startOfMonth(focusedDate));
      focusCalendarRef.current = true;
    }
  }, [dualMonth, open]);

  const close = useCallback(() => {
    setOpen(false);
    setHoveredDate(null);
    // The committed value is untouched until Apply. Every open starts a fresh draft.
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  function show() {
    setDraft(committed);
    setSelectingEnd(false);
    setMonth(startOfMonth(committed.start));
    setFocusedDate(committed.start);
    setHoveredDate(null);
    setPosition(null);
    focusCalendarRef.current = true;
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return undefined;

    function placePopup() {
      const trigger = triggerRef.current;
      const popup = popupRef.current;
      if (!trigger || !popup) return;
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft || 0;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const margin = viewportWidth < 480 ? 4 : 8;
      const width = popup.getBoundingClientRect().width;
      const maxHeight = viewportHeight - margin * 2;
      const height = Math.min(popup.getBoundingClientRect().height, maxHeight);
      const anchor = trigger.getBoundingClientRect();
      const minimumTop = viewportTop + margin;
      const maximumTop = viewportTop + viewportHeight - height - margin;
      const above = anchor.top - height - 8;
      setPosition({
        left: Math.max(viewportLeft + margin, Math.min(anchor.right - width, viewportLeft + viewportWidth - width - margin)),
        // Prefer upward placement; near the page top, overlap the trigger rather
        // than switching below it or letting any part leave the viewport.
        top: Math.max(minimumTop, Math.min(above, maximumTop)),
        maxHeight,
      });
    }

    placePopup();
    const observer = new ResizeObserver(placePopup);
    observer.observe(popupRef.current);
    window.addEventListener('resize', placePopup);
    // The capture listener also follows scrolling inside the app's content area.
    window.addEventListener('scroll', placePopup, true);
    window.visualViewport?.addEventListener('resize', placePopup);
    window.visualViewport?.addEventListener('scroll', placePopup);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', placePopup);
      window.removeEventListener('scroll', placePopup, true);
      window.visualViewport?.removeEventListener('resize', placePopup);
      window.visualViewport?.removeEventListener('scroll', placePopup);
    };
  }, [open, dualMonth]);

  useLayoutEffect(() => {
    if (open && position && focusCalendarRef.current) {
      const day = dayRefs.current.get(focusedDate);
      day?.focus({ preventScroll: true });
      day?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      focusCalendarRef.current = false;
    }
  }, [open, position, month, focusedDate]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeys(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      if (event.key !== 'Tab') return;
      const buttons = [...(popupRef.current?.querySelectorAll('button:not([disabled]):not([tabindex="-1"])') || [])];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const outside = !popupRef.current?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeys, true);
    return () => document.removeEventListener('keydown', handleKeys, true);
  }, [open, close]);

  function moveFocus(date) {
    if (date > maxDate) date = maxDate;
    setFocusedDate(date);
    if (startOfMonth(date) < month || startOfMonth(date) > visibleMonths.at(-1)) setMonth(startOfMonth(date));
    setHoveredDate(null);
    focusCalendarRef.current = true;
  }

  function navigateMonth(amount) {
    if (addMonths(month, amount) > startOfMonth(maxDate)) return;
    setMonth((current) => addMonths(current, amount));
    setFocusedDate(addMonths(month, amount));
    setHoveredDate(null);
  }

  function handleDayKeys(event, date) {
    const weekday = fromDateKey(date).getDay();
    let target;
    switch (event.key) {
      case 'ArrowLeft': target = addDays(date, -1); break;
      case 'ArrowRight': target = addDays(date, 1); break;
      case 'ArrowUp': target = addDays(date, -7); break;
      case 'ArrowDown': target = addDays(date, 7); break;
      case 'Home': target = addDays(date, -weekday); break;
      case 'End': target = addDays(date, 6 - weekday); break;
      case 'PageUp': target = addMonths(date, event.shiftKey ? -12 : -1); break;
      case 'PageDown': target = addMonths(date, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    moveFocus(target);
  }

  function selectDay(date) {
    if (date > maxDate) return;
    moveFocus(date);
    if (!selectingEnd) {
      setDraft({ start: date, end: date });
      setSelectingEnd(true);
    } else {
      setDraft(sortRange(draft.start, date));
      setSelectingEnd(false);
    }
  }

  function selectPreset(preset) {
    if (preset.disabled) return;
    setDraft({ start: preset.start, end: preset.end });
    setSelectingEnd(false);
    setMonth(startOfMonth(preset.start));
    setFocusedDate(preset.start);
    setHoveredDate(null);
  }

  function apply() {
    if (!draft.start || !draft.end) return;
    onChange(sortRange(draft.start, draft.end));
    close();
  }

  const preview = selectingEnd && hoveredDate;
  const paintedRange = preview ? sortRange(draft.start, preview) : draft;
  const instruction = selectingEnd
    ? 'Selecione a data final ou aplique para consultar só este dia.'
    : 'Selecione um dia ou a data inicial e final de um período.';

  return (
    <div className="date-range-picker">
      <label id={`${id}-label`} htmlFor={`${id}-trigger`}>Período dos dados</label>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className={`drp-trigger${open ? ' is-open' : ''}`}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-dialog` : undefined}
        onClick={open ? close : show}
      >
        <span id={`${id}-value`}>{formatRange(committed)}</span>
        <PickerIcon icon={Calendar03Icon} size={16} />
      </button>

      {open && createPortal(
        <div className="drp-layer" onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            close();
          }
        }}>
          <section
            ref={popupRef}
            id={`${id}-dialog`}
            className="drp-popup"
            style={position || { visibility: 'hidden' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-instruction`}
          >
            <h2 id={`${id}-title`} className="drp-sr-only">Selecionar período</h2>
              <div className="drp-presets" role="group" aria-label="Períodos rápidos">
                {getPresets(today).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.description}
                    disabled={preset.disabled}
                    aria-pressed={draft.start === preset.start && draft.end === preset.end}
                    onClick={() => selectPreset(preset)}
                  >{preset.label}</button>
                ))}
              </div>
            <div className="drp-main">
              <div className="drp-period" aria-live="polite" aria-atomic="true">
                <span><span className="drp-sr-only">Data inicial: </span>{formatDate(draft.start)}</span>
                <span className="drp-period-separator" aria-hidden="true">~</span>
                <span><span className="drp-sr-only">Data final: </span>{formatDate(draft.end)}</span>
              </div>
              <div className="drp-calendars" onPointerLeave={() => setHoveredDate(null)}>
              {visibleMonths.map((calendarMonth, index) => (
              <div className="drp-calendar" key={calendarMonth}>
                <div className="drp-month-navigation">
                  <div className="drp-nav-side">
                  {index === 0 && <>
                  <button type="button" className="drp-icon-button" aria-label="Ano anterior" onClick={() => navigateMonth(-12)}>
                    <span className="drp-double-icon"><PickerIcon icon={ArrowLeft01Icon} /><PickerIcon icon={ArrowLeft01Icon} /></span>
                  </button>
                  <button type="button" className="drp-icon-button" aria-label="Mês anterior" onClick={() => navigateMonth(-1)}>
                    <PickerIcon icon={ArrowLeft01Icon} />
                  </button>
                  </>}
                  </div>
                  <h3 id={`${id}-month-${index}`} aria-live="polite">{formatDate(calendarMonth, 'calendar-month')}</h3>
                  <div className="drp-nav-side">
                  {index === visibleMonths.length - 1 && <>
                  <button type="button" className="drp-icon-button" aria-label="Próximo mês" disabled={addMonths(month, 1) > startOfMonth(maxDate)} onClick={() => navigateMonth(1)}>
                    <PickerIcon icon={ArrowRight01Icon} />
                  </button>
                  <button type="button" className="drp-icon-button" aria-label="Próximo ano" disabled={addMonths(month, 12) > startOfMonth(maxDate)} onClick={() => navigateMonth(12)}>
                    <span className="drp-double-icon"><PickerIcon icon={ArrowRight01Icon} /><PickerIcon icon={ArrowRight01Icon} /></span>
                  </button>
                  </>}
                  </div>
                </div>

                <div className="drp-grid" role="grid" aria-labelledby={`${id}-month-${index}`} aria-multiselectable="true">
                  <div className="drp-weekdays" role="row">
                    {weekdays.map((day, index) => <span key={day} role="columnheader" aria-label={weekdayNames[index]}>{day}</span>)}
                  </div>
                  {calendarWeeks(calendarMonth, 6).map((week) => (
                    <div key={week[0]} className="drp-week" role="row">
                      {week.map((date) => {
                        const outside = date.slice(0, 7) !== calendarMonth.slice(0, 7);
                        const unavailable = date > maxDate;
                        const isStart = date === draft.start;
                        const isEnd = date === draft.end;
                        const isSelected = !outside && (isStart || (draft.end && date >= draft.start && date <= draft.end));
                        const inPaintedRange = !outside && paintedRange.end && date >= paintedRange.start && date <= paintedRange.end;
                        const classes = [
                          'drp-day-cell',
                          outside && 'is-outside-month',
                          unavailable && 'is-unavailable',
                          inPaintedRange && 'is-in-range',
                          inPaintedRange && date === paintedRange.start && 'is-range-start',
                          inPaintedRange && date === paintedRange.end && 'is-range-end',
                          !outside && (isStart || isEnd) && 'is-endpoint',
                        ].filter(Boolean).join(' ');
                        const description = isStart && isEnd ? ', dia selecionado' : isStart ? ', data inicial' : isEnd ? ', data final' : '';
                        return (
                          <div key={date} className={classes} role="gridcell" aria-selected={Boolean(isSelected)}>
                            {outside ? <span className="drp-day" aria-hidden="true">{fromDateKey(date).getDate()}</span> : <button
                              ref={(element) => {
                                if (element) dayRefs.current.set(date, element);
                                else dayRefs.current.delete(date);
                              }}
                              type="button"
                              disabled={unavailable}
                              className="drp-day"
                              tabIndex={date === focusedDate ? 0 : -1}
                              aria-label={`${formatDate(date, 'long')}${description}`}
                              aria-current={date === today ? 'date' : undefined}
                              onClick={() => selectDay(date)}
                              onFocus={() => setFocusedDate(date)}
                              onPointerEnter={() => setHoveredDate(unavailable ? null : date)}
                              onKeyDown={(event) => handleDayKeys(event, date)}
                            >{fromDateKey(date).getDate()}</button>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              ))}
              </div>

            <footer className="drp-footer">
              <p id={`${id}-instruction`} className="drp-sr-only" aria-live="polite">{instruction}</p>
              <div className="drp-actions">
              <button type="button" className="drp-cancel" onClick={close}>Cancelar</button>
              <button type="button" className="drp-apply" disabled={!draft.end} onClick={apply}>Aplicar</button>
              </div>
            </footer>
            </div>
            <p className="drp-sr-only">Use as setas para navegar pelos dias, Home e End para a semana e Page Up e Page Down para mudar o mês. Com Shift, mude o ano. Enter seleciona uma data. Escape cancela.</p>
          </section>
        </div>, document.body,
      )}
    </div>
  );
}
