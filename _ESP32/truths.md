# Truth Tables

## Microstep Resolution

| S1  | S2  | S3  | Microstep | Pulse/Rev |
|-----|-----|-----|-----------|-----------|
| ON  | ON  | ON  | NC        | NC        |
| ON  | ON  | OFF | 1         | 200       |
| ON  | OFF | ON  | 2/A       | 400       |
| OFF | ON  | ON  | 2/B       | 400       |
| ON  | OFF | OFF | 4         | 800       |
| OFF | ON  | OFF | 8         | 1600      |
| OFF | OFF | ON  | 16        | 3200      |
| OFF | OFF | OFF | 32        | 6400      |

## Current Settings

| S4  | S5  | S6  | Current (A) | Pk Current (A) |
|-----|-----|-----|-------------|----------------|
| ON  | ON  | ON  | 0.5         | 0.7            |
| ON  | OFF | ON  | 1.0         | 1.2            |
| ON  | ON  | OFF | 1.5         | 1.7            |
| ON  | OFF | OFF | 2.0         | 2.2            |
| OFF | ON  | ON  | 2.5         | 2.7            |
| OFF | OFF | ON  | 2.8         | 2.9            |
| OFF | ON  | OFF | 3.0         | 3.2            |
| OFF | OFF | OFF | 3.5         | 4.0            |

## ALL 64 COMBINATIONS

| S1  | S2  | S3  | S4  | S5  | S6  | Microstep | Pulse/Rev | Current (A) | Pk Current (A) |
|-----|-----|-----|-----|-----|-----|-----------|-----------|-------------|----------------|
| ON  | ON  | ON  | ON  | ON  | ON  | NC        | NC        | 0.5         | 0.7            |
| ON  | ON  | ON  | ON  | OFF | ON  | NC        | NC        | 1.0         | 1.2            |
| ON  | ON  | ON  | ON  | ON  | OFF | NC        | NC        | 1.5         | 1.7            |
| ON  | ON  | ON  | ON  | OFF | OFF | NC        | NC        | 2.0         | 2.2            |
| ON  | ON  | ON  | OFF | ON  | ON  | NC        | NC        | 2.5         | 2.7            |
| ON  | ON  | ON  | OFF | OFF | ON  | NC        | NC        | 2.8         | 2.9            |
| ON  | ON  | ON  | OFF | ON  | OFF | NC        | NC        | 3.0         | 3.2            |
| ON  | ON  | ON  | OFF | OFF | OFF | NC        | NC        | 3.5         | 4.0            |
| ON  | ON  | OFF | ON  | ON  | ON  | 1         | 200       | 0.5         | 0.7            |
| ON  | ON  | OFF | ON  | OFF | ON  | 1         | 200       | 1.0         | 1.2            |
| ON  | ON  | OFF | ON  | ON  | OFF | 1         | 200       | 1.5         | 1.7            |
| ON  | ON  | OFF | ON  | OFF | OFF | 1         | 200       | 2.0         | 2.2            |
| ON  | ON  | OFF | OFF | ON  | ON  | 1         | 200       | 2.5         | 2.7            |
| ON  | ON  | OFF | OFF | OFF | ON  | 1         | 200       | 2.8         | 2.9            |
| ON  | ON  | OFF | OFF | ON  | OFF | 1         | 200       | 3.0         | 3.2            |
| ON  | ON  | OFF | OFF | OFF | OFF | 1         | 200       | 3.5         | 4.0            |
| ON  | OFF | ON  | ON  | ON  | ON  | 2/A       | 400       | 0.5         | 0.7            |
| ON  | OFF | ON  | ON  | OFF | ON  | 2/A       | 400       | 1.0         | 1.2            |
| ON  | OFF | ON  | ON  | ON  | OFF | 2/A       | 400       | 1.5         | 1.7            |
| ON  | OFF | ON  | ON  | OFF | OFF | 2/A       | 400       | 2.0         | 2.2            |
| ON  | OFF | ON  | OFF | ON  | ON  | 2/A       | 400       | 2.5         | 2.7            |
| ON  | OFF | ON  | OFF | OFF | ON  | 2/A       | 400       | 2.8         | 2.9            |
| ON  | OFF | ON  | OFF | ON  | OFF | 2/A       | 400       | 3.0         | 3.2            |
| ON  | OFF | ON  | OFF | OFF | OFF | 2/A       | 400       | 3.5         | 4.0            |
| OFF | ON  | ON  | ON  | ON  | ON  | 2/B       | 400       | 0.5         | 0.7            |
| OFF | ON  | ON  | ON  | OFF | ON  | 2/B       | 400       | 1.0         | 1.2            |
| OFF | ON  | ON  | ON  | ON  | OFF | 2/B       | 400       | 1.5         | 1.7            |
| OFF | ON  | ON  | ON  | OFF | OFF | 2/B       | 400       | 2.0         | 2.2            |
| OFF | ON  | ON  | OFF | ON  | ON  | 2/B       | 400       | 2.5         | 2.7            |
| OFF | ON  | ON  | OFF | OFF | ON  | 2/B       | 400       | 2.8         | 2.9            |
| OFF | ON  | ON  | OFF | ON  | OFF | 2/B       | 400       | 3.0         | 3.2            |
| OFF | ON  | ON  | OFF | OFF | OFF | 2/B       | 400       | 3.5         | 4.0            |
| ON  | OFF | OFF | ON  | ON  | ON  | 4         | 800       | 0.5         | 0.7            |
| ON  | OFF | OFF | ON  | OFF | ON  | 4         | 800       | 1.0         | 1.2            |
| ON  | OFF | OFF | ON  | ON  | OFF | 4         | 800       | 1.5         | 1.7            |
| ON  | OFF | OFF | ON  | OFF | OFF | 4         | 800       | 2.0         | 2.2            |
| ON  | OFF | OFF | OFF | ON  | ON  | 4         | 800       | 2.5         | 2.7            |
| ON  | OFF | OFF | OFF | OFF | ON  | 4         | 800       | 2.8         | 2.9            |
| ON  | OFF | OFF | OFF | ON  | OFF | 4         | 800       | 3.0         | 3.2            |
| ON  | OFF | OFF | OFF | OFF | OFF | 4         | 800       | 3.5         | 4.0            |
| OFF | ON  | OFF | ON  | ON  | ON  | 8         | 1600      | 0.5         | 0.7            |
| OFF | ON  | OFF | ON  | OFF | ON  | 8         | 1600      | 1.0         | 1.2            |
| OFF | ON  | OFF | ON  | ON  | OFF | 8         | 1600      | 1.5         | 1.7            |
| OFF | ON  | OFF | ON  | OFF | OFF | 8         | 1600      | 2.0         | 2.2            |
| OFF | ON  | OFF | OFF | ON  | ON  | 8         | 1600      | 2.5         | 2.7            |
| OFF | ON  | OFF | OFF | OFF | ON  | 8         | 1600      | 2.8         | 2.9            |
| OFF | ON  | OFF | OFF | ON  | OFF | 8         | 1600      | 3.0         | 3.2            |
| OFF | ON  | OFF | OFF | OFF | OFF | 8         | 1600      | 3.5         | 4.0            |
| OFF | OFF | ON  | ON  | ON  | ON  | 16        | 3200      | 0.5         | 0.7            |
| OFF | OFF | ON  | ON  | OFF | ON  | 16        | 3200      | 1.0         | 1.2            |
| OFF | OFF | ON  | ON  | ON  | OFF | 16        | 3200      | 1.5         | 1.7            |
| OFF | OFF | ON  | ON  | OFF | OFF | 16        | 3200      | 2.0         | 2.2            |
| OFF | OFF | ON  | OFF | ON  | ON  | 16        | 3200      | 2.5         | 2.7            |
| OFF | OFF | ON  | OFF | OFF | ON  | 16        | 3200      | 2.8         | 2.9            |
| OFF | OFF | ON  | OFF | ON  | OFF | 16        | 3200      | 3.0         | 3.2            |
| OFF | OFF | ON  | OFF | OFF | OFF | 16        | 3200      | 3.5         | 4.0            |
| OFF | OFF | OFF | ON  | ON  | ON  | 32        | 6400      | 0.5         | 0.7            |
| OFF | OFF | OFF | ON  | OFF | ON  | 32        | 6400      | 1.0         | 1.2            |
| OFF | OFF | OFF | ON  | ON  | OFF | 32        | 6400      | 1.5         | 1.7            |
| OFF | OFF | OFF | ON  | OFF | OFF | 32        | 6400      | 2.0         | 2.2            |
| OFF | OFF | OFF | OFF | ON  | ON  | 32        | 6400      | 2.5         | 2.7            |
| OFF | OFF | OFF | OFF | OFF | ON  | 32        | 6400      | 2.8         | 2.9            |
| OFF | OFF | OFF | OFF | ON  | OFF | 32        | 6400      | 3.0         | 3.2            |
| OFF | OFF | OFF | OFF | OFF | OFF | 32        | 6400      | 3.5         | 4.0            |