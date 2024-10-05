"use client"

import React from 'react';
import { RiCloseLine } from '@remixicon/react';

import { Button } from '@/components/tremor/Button';
import { Card } from '@/components/tremor/Card';

const data = [
    {
        step: 1,
        title: 'Connect data',
        description: 'Bring your existing data source or create a new one.',
        buttonText: 'Add data',
        disabled: false,
        tooltipText: '',
    },
    {
        step: 2,
        title: 'Add metrics',
        description:
            'Create metrics using custom SQL or with our aggregation mask.',
        buttonText: 'Add metric',
        disabled: true,
        tooltipText: 'Connect to a data source first',
    },
    {
        step: 3,
        title: 'Create report',
        description:
            'Transform metrics into visualizations and add layout elements.',
        buttonText: 'Create report',
        disabled: true,
        tooltipText: 'Create metrics first',
    },
];

export default function WelcomeBanner() {
    const [isOpen, setIsOpen] = React.useState(true);

    // just for demo purposes
    React.useEffect(() => {
        if (!isOpen) {
            const timeoutId: NodeJS.Timeout = setTimeout(() => {
                setIsOpen(true);
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [isOpen]);

    return isOpen ? (
        <>
            <Card>
                <div className="absolute right-0 top-0 pr-3 pt-3">
                    <Button
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-500 hover:dark:text-gray-300"
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close"
                    >
                        <RiCloseLine className="size-5 shrink-0" aria-hidden={true} />
                    </Button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Create your first dashboard
                </h3>
                <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
                    Set up your first dashboard. Connect to a data source, create metrics
                    and visualize them in the report builder.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {data.map((item) => (
                        <div
                            key={item.title}
                            className="flex flex-col justify-between border-l-2 border-blue-100 py-1 pl-4 dark:border-blue-400/20"
                        >
                            <div>
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-500 dark:bg-blue-400/20 dark:text-blue-500">
                                    Step {item.step}
                                </span>
                                <h4 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-50">
                                    {item.title}
                                </h4>
                                <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
                                    {item.description}
                                </p>
                            </div>
                            <Button disabled={item.disabled} className="mt-8">
                                {item.buttonText}
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>
        </>
    ) : null;
}