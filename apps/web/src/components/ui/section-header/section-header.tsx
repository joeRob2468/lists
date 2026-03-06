import { Text } from '@mantine/core';
import classes from './section-header.module.css';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader = ({ title }: SectionHeaderProps) => {
  return <Text className={classes.sectionTitle}>{title}</Text>;
};
