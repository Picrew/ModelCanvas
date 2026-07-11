"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  ShieldAlert,
  X,
} from "lucide-react";
import type { RendererComponentProps } from "@/src/core";
import type { KnownRenderEnvelope } from "@/src/schema";

type FormEnvelope = Extract<KnownRenderEnvelope, { type: "form.dynamic" }>;

export default function FormRenderer({
  envelope,
  onEvent,
}: RendererComponentProps) {
  if (envelope.type !== "form.dynamic")
    throw new Error("Form renderer received an incompatible envelope");
  const form = envelope as FormEnvelope;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<
    Record<string, string | boolean | number>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const current = form.payload.steps[step]!;
  const progress = ((step + 1) / form.payload.steps.length) * 100;

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    for (const field of current.fields) {
      if (
        field.required &&
        (values[field.id] === undefined ||
          values[field.id] === "" ||
          values[field.id] === false)
      )
        nextErrors[field.id] = `${field.label} is required`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const submit = () => {
    if (!validateStep()) return;
    if (form.payload.confirmation && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setSubmitted(true);
    onEvent?.({
      type: "form.submit",
      renderer: "form.dynamic",
      action: "submit",
      payload: values,
    });
  };

  if (submitted)
    return (
      <section
        className="form-renderer form-success"
        data-testid="form-success"
      >
        <div className="success-mark">
          <Check />
        </div>
        <p className="eyebrow">Local demo event</p>
        <h2>Form submitted safely</h2>
        <p>
          No external system was changed. The validated values were emitted to
          the host.
        </p>
        <pre>{JSON.stringify(values, null, 2)}</pre>
        <button
          className="button secondary"
          type="button"
          onClick={() => setSubmitted(false)}
        >
          Edit response
        </button>
      </section>
    );

  return (
    <section className="form-renderer" data-testid="dynamic-form">
      <header>
        <p className="eyebrow">
          Declarative catalog · step {step + 1} of {form.payload.steps.length}
        </p>
        <h2>{form.payload.title}</h2>
        <p>{form.payload.description}</p>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <ol className="form-steps">
          {form.payload.steps.map((item, index) => (
            <li
              className={
                index === step ? "active" : index < step ? "complete" : ""
              }
              key={item.id}
            >
              <span>{index < step ? <Check /> : index + 1}</span>
              {item.title}
            </li>
          ))}
        </ol>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          step < form.payload.steps.length - 1
            ? validateStep() && setStep((value) => value + 1)
            : submit();
        }}
      >
        <h3>{current.title}</h3>
        <div className="form-fields">
          {current.fields.map((field) => {
            const value = values[field.id];
            const setValue = (next: string | boolean | number) => {
              setValues((currentValues) => ({
                ...currentValues,
                [field.id]: next,
              }));
              setErrors((currentErrors) => ({
                ...currentErrors,
                [field.id]: "",
              }));
            };
            return (
              <div
                className={`form-field ${errors[field.id] ? "invalid" : ""}`}
                key={field.id}
              >
                <label htmlFor={field.id}>
                  {field.label}
                  {field.required ? <span> *</span> : null}
                </label>
                {field.kind === "textarea" ? (
                  <textarea
                    id={field.id}
                    value={String(value ?? "")}
                    placeholder={
                      "placeholder" in field ? field.placeholder : undefined
                    }
                    onChange={(event) => setValue(event.target.value)}
                  />
                ) : field.kind === "select" ? (
                  <select
                    id={field.id}
                    value={String(value ?? "")}
                    onChange={(event) => setValue(event.target.value)}
                  >
                    <option value="">Select…</option>
                    {field.options.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.kind === "radio" ? (
                  <div className="radio-group">
                    {field.options.map((option) => (
                      <label key={option.value}>
                        <input
                          type="radio"
                          name={field.id}
                          value={option.value}
                          checked={value === option.value}
                          onChange={() => setValue(option.value)}
                        />{" "}
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : field.kind === "checkbox" || field.kind === "switch" ? (
                  <label className="switch-control">
                    <input
                      id={field.id}
                      type="checkbox"
                      checked={Boolean(value ?? field.defaultValue)}
                      onChange={(event) => setValue(event.target.checked)}
                    />
                    <span />{" "}
                    {Boolean(value ?? field.defaultValue)
                      ? "Enabled"
                      : "Disabled"}
                  </label>
                ) : field.kind === "slider" ? (
                  <div className="slider-control">
                    <input
                      id={field.id}
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={Number(value ?? field.defaultValue ?? field.min)}
                      onChange={(event) => setValue(Number(event.target.value))}
                    />
                    <output>
                      {Number(value ?? field.defaultValue ?? field.min)}
                    </output>
                  </div>
                ) : field.kind === "file" ? (
                  <label className="file-control" htmlFor={field.id}>
                    <FileUp />{" "}
                    <span>{String(value ?? "Choose local file")}</span>
                    <input
                      id={field.id}
                      type="file"
                      onChange={(event) =>
                        setValue(event.target.files?.[0]?.name ?? "")
                      }
                    />
                  </label>
                ) : (
                  <input
                    id={field.id}
                    type={field.kind}
                    value={String(value ?? "")}
                    placeholder={
                      "placeholder" in field ? field.placeholder : undefined
                    }
                    onChange={(event) => setValue(event.target.value)}
                  />
                )}
                {errors[field.id] ? (
                  <small role="alert">{errors[field.id]}</small>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() =>
              step
                ? setStep((value) => value - 1)
                : onEvent?.({
                    type: "form.cancel",
                    renderer: "form.dynamic",
                    action: "cancel",
                  })
            }
          >
            {step ? <ArrowLeft /> : <X />}
            {step ? "Back" : "Cancel"}
          </button>
          <button className="button primary" type="submit">
            {step < form.payload.steps.length - 1 ? (
              <>
                Next <ArrowRight />
              </>
            ) : (
              <>
                {form.payload.submitLabel} <Check />
              </>
            )}
          </button>
        </div>
      </form>
      {confirming ? (
        <div className="confirm-backdrop">
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="form-confirm"
          >
            <ShieldAlert />
            <p className="eyebrow">Review before submit</p>
            <h2 id="form-confirm">Confirm form event</h2>
            <p>The host will receive the validated values below.</p>
            <pre>{JSON.stringify(values, null, 2)}</pre>
            <div className="button-row">
              <button
                className="button secondary"
                type="button"
                onClick={() => setConfirming(false)}
              >
                <X /> Go back
              </button>
              <button className="button primary" type="button" onClick={submit}>
                <Check /> Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
