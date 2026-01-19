import React from "react";

function SettingHeader(props: React.PropsWithChildren<{ title: string; description: string; }>) {
    const { title, description, children } = props;
    return (
        <div className="flex w-full items-center justify-between border-b border-gray-200 pb-5 mb-5 dark:border-gray-700">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="mt-2 text-slate-500">
                    {description}
                </p>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}

export default React.memo(SettingHeader)