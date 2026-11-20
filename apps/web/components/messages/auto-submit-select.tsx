'use client';

/**
 * A select inside a GET form that submits the form when it changes. Without
 * JavaScript the form's own button submits it, so the filters still work.
 */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
