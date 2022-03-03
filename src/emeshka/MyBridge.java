package emeshka;

import com.google.gson.Gson;
import emeshka.webengineapp.DefaultBridge;

/**
 * Created by Alexandra on 03.06.2018.
 */
public class MyBridge extends DefaultBridge {
    @Override
    public String toString() {
        return "{MyBridge Object}";
    }

    public String nextGeneration(String currentGeneration) {
        Gson g = new Gson();
        int[][] matrix = new int[][]{};
        //System.out.println(currentGeneration);
        matrix = g.fromJson(currentGeneration, matrix.getClass());
        //System.out.println("passing to Main.nextGeneration()");
        int[][] result = Main.nextGeneration(matrix);
        //System.out.println("result from Main.nextGeneration()");
        String str = g.toJson(result);
        //System.out.println(str);
        return str;
    }

    public void savePreferences(String json) {
        Main.savePreferences(json);
    }

    public String loadPreferences() {
        return Main.loadPreferences();
    }

    /*public String predictPrevious(String currentGeneration) {
        Gson g = new Gson();
        boolean[][] matrix = new boolean[][]{};
        matrix = g.fromJson(currentGeneration, matrix.getClass());
        boolean[][] result = Main.previousGeneration(matrix);
        return g.toJson(result);
    }*/
}
