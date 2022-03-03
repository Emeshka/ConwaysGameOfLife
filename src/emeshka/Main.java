package emeshka;

import emeshka.webengineapp.*;
import javafx.application.Platform;

import java.io.*;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;

/**
 * Created by Alexandra on 03.06.2018.
 */

public class Main {
    public static String PREFERENCES = System.getProperty("user.home") + "/.CGOL_settings.json";
    private static final String root = getRoot();//absolute path to directory with our executing program

    private static String getRoot() {
        String root = null;
        try {
            root = (new File(Main.class.getProtectionDomain().getCodeSource().getLocation().toURI()))
                    /*.getParentFile().getParentFile().getParentFile()*/.getParentFile().getPath();
        } catch (URISyntaxException e) {
            Accessory.alert(e, "tried to get root :(");
        }
        return root;
    }

    // toroidal
    public static int[][] nextGeneration(int[][] cur) {
        int[][] next = new int[cur.length][cur.length];
        for (int i = 0; i < cur.length; i++) {
            for (int j = 0; j < cur.length; j++) {
                //сначала столбец, потом строка! Так он рисует!
                int neighbours = 0;
                int leftTop = cur[(i == 0) ? cur.length - 1 : i - 1][(j == 0) ? cur.length - 1 : j - 1];
                int left = cur[(i == 0) ? cur.length - 1 : i - 1][j];
                int leftBottom = cur[(i == 0) ? cur.length - 1 : i - 1][(j == cur.length - 1) ? 0 : j + 1];
                int bottom = cur[i][(j == cur.length - 1) ? 0 : j + 1];
                int rightBottom = cur[(i == cur.length - 1) ? 0 : i + 1][(j == cur.length - 1) ? 0 : j + 1];
                int right = cur[(i == cur.length - 1) ? 0 : i + 1][j];
                int rightTop = cur[(i == cur.length - 1) ? 0 : i + 1][(j == 0) ? cur.length - 1 : j - 1];
                int top = cur[i][(j == 0) ? cur.length - 1 : j - 1];

                if (leftTop == 2 || leftTop == 3) neighbours++;
                if (left == 2 || left == 3) neighbours++;
                if (leftBottom == 2 || leftBottom == 3) neighbours++;
                if (bottom == 2 || bottom == 3) neighbours++;
                if (rightBottom == 2 || rightBottom == 3) neighbours++;
                if (right == 2 || right == 3) neighbours++;
                if (rightTop == 2 || rightTop == 3) neighbours++;
                if (top == 2 || top == 3) neighbours++;

                if ((cur[i][j] == 0 || cur[i][j] == 1) && neighbours == 3) next[i][j] = 2;//только что ожили
                else if ((cur[i][j] == 2 || cur[i][j] == 3) && (neighbours == 2 || neighbours == 3)) next[i][j] = 3;
                else {
                    if (cur[i][j] == 1 || cur[i][j] == 2 || cur[i][j] == 3) next[i][j] = 1;
                    else next[i][j] = 0;
                }
            }
        }
        return next;
    }

    public static void savePreferences(String json) {
        File fd = new File(PREFERENCES);
        try {
            Files.deleteIfExists(fd.toPath());
            PrintWriter writer = new PrintWriter(PREFERENCES, "UTF-8");
            writer.println(json);
            writer.close();
        } catch (IOException e) {
            Accessory.alert(e, "Failed to save preferences!");
        }
    }

    public static String loadPreferences() {
        File file = new File(PREFERENCES);
        String result = "";
        if (file.exists()) {
            try {
                BufferedReader br = new BufferedReader(
                        new InputStreamReader(
                                new FileInputStream(file), "UTF-8"
                        )
                );
                String line = null;
                while ((line = br.readLine()) != null) {
                    result += line;
                }
                br.close();
            } catch (FileNotFoundException e) {
                Accessory.alert(e, "Failed to load preferences!");
            } catch (UnsupportedEncodingException e) {
                Accessory.alert(e, "Failed to load preferences!");
            } catch (IOException e) {
                Accessory.alert(e, "Failed to load preferences!");
            }
        } else {
            try {
                file.createNewFile();
            } catch (IOException e) {
                Accessory.alert(e, "Failed to create new preferences file!");
            }
        }
        return result;
    }

    public static void main(String[] args) {
        try {
            Application app = new Application("Conway's Game of Life",
                    root+"/cgol.html", -1, -1, new MyBridge());
            app.run();
            TimeUnit.SECONDS.sleep(5);
            //Platform.runLater(app::test);
        } catch (InterruptedException e) {
            Accessory.alert(e, "can be caused by TimeUnit.SECONDS.sleep()");
        }
    }
}
