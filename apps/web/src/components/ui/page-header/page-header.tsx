import { Group, Text, Title } from '@mantine/core';
import classes from './page-header.module.css';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className={classes.heroSection}>
      <Group justify="space-between" align="flex-end">
        <div className={classes.titleWrapper}>
          {typeof title === 'string' ? <Title order={1}>{title}</Title> : title}

          {subtitle && (
            <Text c="dimmed" mt={4}>
              {subtitle}
            </Text>
          )}
        </div>

        <Group>{actions}</Group>
      </Group>
    </div>
  );
};
